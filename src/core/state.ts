import { isUnlockEligible } from './criteria';
import type { UnlockCriteriaEvaluationOptions } from './criteria';
import type { UnlockContext, UnlockStatus, UnlockableDefinition } from './types';

export interface UnlockState {
  readonly statusById: Readonly<Record<string, UnlockStatus>>;
  readonly skipped: boolean;
}

interface PersistedUnlockState {
  readonly version: 1;
  readonly skipped: boolean;
  readonly unlockedIds: readonly string[];
}

export interface ParseUnlockStateOptions {
  readonly warn?: (message: string, details?: unknown) => void;
  readonly appId?: string;
}

const PERSISTENCE_VERSION = 1;

const legalTransitions: Readonly<Record<UnlockStatus, readonly UnlockStatus[]>> = {
  HIDDEN: ['ELIGIBLE'],
  ELIGIBLE: ['UNLOCKING'],
  UNLOCKING: ['UNLOCKED'],
  UNLOCKED: [],
};

export function createUnlockState(
  definitions: readonly UnlockableDefinition[],
  context: UnlockContext,
  options: UnlockCriteriaEvaluationOptions = {},
): UnlockState {
  const statusById: Record<string, UnlockStatus> = {};

  for (const definition of definitions) {
    if (context.statusById?.[definition.id] === 'UNLOCKED') {
      statusById[definition.id] = 'UNLOCKED';
      continue;
    }

    statusById[definition.id] = isUnlockEligible(definition, context, options) ? 'ELIGIBLE' : 'HIDDEN';
  }

  return { statusById, skipped: false };
}

export function transitionUnlockStatus(state: UnlockState, id: string, nextStatus: UnlockStatus): UnlockState {
  if (!Object.prototype.hasOwnProperty.call(state.statusById, id)) {
    return state;
  }

  const currentStatus = state.statusById[id];
  if (!isUnlockStatus(currentStatus)) {
    return state;
  }

  if (currentStatus === nextStatus) {
    return state;
  }

  if (!legalTransitions[currentStatus].includes(nextStatus)) {
    return state;
  }

  return {
    ...state,
    statusById: {
      ...state.statusById,
      [id]: nextStatus,
    },
  };
}

export function markUnlocked(state: UnlockState, id: string): UnlockState {
  return transitionUnlockStatus(state, id, 'UNLOCKED');
}

export function skipUnlocks(state: UnlockState, definitions: readonly UnlockableDefinition[]): UnlockState {
  const statusById = copyStatusById(state.statusById);

  for (const definition of definitions) {
    statusById[definition.id] = 'UNLOCKED';
  }

  return { statusById, skipped: true };
}

export function serializeUnlockState(state: UnlockState): string {
  const unlockedIds = Object.entries(state.statusById)
    .filter(([, status]) => status === 'UNLOCKED')
    .map(([id]) => id)
    .sort();

  const persisted: PersistedUnlockState = {
    version: PERSISTENCE_VERSION,
    skipped: state.skipped,
    unlockedIds,
  };

  return JSON.stringify(persisted);
}

export function parseUnlockState(
  raw: string | null | undefined,
  definitions: readonly UnlockableDefinition[],
  options: ParseUnlockStateOptions = {},
): UnlockState {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return createHiddenUnlockState(definitions);
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedUnlockState(parsed)) {
      warnInvalidPersistedState(options, 'Persisted unlock state has an invalid shape.', parsed);
      return createHiddenUnlockState(definitions);
    }

    const knownIds = new Set(definitions.map((definition) => definition.id));
    const unlockedIds = new Set(parsed.unlockedIds.filter((id) => knownIds.has(id)));
    const statusById: Record<string, UnlockStatus> = {};

    for (const definition of definitions) {
      statusById[definition.id] = unlockedIds.has(definition.id) ? 'UNLOCKED' : 'HIDDEN';
    }

    return { statusById, skipped: parsed.skipped };
  } catch (error) {
    warnInvalidPersistedState(options, 'Persisted unlock state is not valid JSON.', error);
    return createHiddenUnlockState(definitions);
  }
}

export function createStorageKey(appId: string): string {
  return `unlockable:state:${appId}`;
}

function createHiddenUnlockState(definitions: readonly UnlockableDefinition[]): UnlockState {
  const statusById: Record<string, UnlockStatus> = {};

  for (const definition of definitions) {
    statusById[definition.id] = 'HIDDEN';
  }

  return { statusById, skipped: false };
}

function isPersistedUnlockState(value: unknown): value is PersistedUnlockState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === PERSISTENCE_VERSION &&
    typeof value.skipped === 'boolean' &&
    Array.isArray(value.unlockedIds) &&
    value.unlockedIds.every((id) => typeof id === 'string')
  );
}

function copyStatusById(source: Readonly<Record<string, UnlockStatus>>): Record<string, UnlockStatus> {
  const copy: Record<string, UnlockStatus> = {};

  for (const [id, status] of Object.entries(source)) {
    copy[id] = status;
  }

  return copy;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnlockStatus(value: unknown): value is UnlockStatus {
  return value === 'HIDDEN' || value === 'ELIGIBLE' || value === 'UNLOCKING' || value === 'UNLOCKED';
}

function warnInvalidPersistedState(options: ParseUnlockStateOptions, reason: string, details: unknown): void {
  const appLabel = options.appId ? ` for app "${options.appId}"` : '';
  options.warn?.(`Invalid persisted unlockable state${appLabel}; resetting unlock state. ${reason}`, details);
}
