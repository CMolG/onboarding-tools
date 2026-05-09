import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { isUnlockEligible } from '../core/criteria';
import type { UnlockCriteriaEvaluationOptions } from '../core/criteria';
import { createSerializableCatalog, type SerializableUnlockableDefinition } from '../core/catalog';
import { createUnlockState, skipUnlocks as skipUnlockState, transitionUnlockStatus, type UnlockState } from '../core/state';
import { createLocalUnlockableResolver } from '../core/resolver';
import { createLocalStorageAdapter, loadUnlockState, saveUnlockState } from '../core/storage';
import { isDevelopmentRuntime } from '../env';
import type {
  UnlockContext,
  UnlockDecision,
  UnlockResolver,
  UnlockStatus,
  UnlockableDefinition,
  UnlockableOverlayConfig,
  UnlockableStorageAdapter,
  UnlockableTheme,
} from '../core/types';

interface RegistryEntry {
  readonly definition: UnlockableDefinition;
  readonly count: number;
}

interface UnlockableContextValue {
  readonly appId: string;
  readonly definitions: readonly UnlockableDefinition[];
  readonly catalog: readonly SerializableUnlockableDefinition[];
  readonly statusById: Readonly<Record<string, UnlockStatus>>;
  readonly events: readonly string[];
  readonly signals: readonly string[];
  readonly userArchetypes: readonly string[];
  readonly flags: Readonly<Record<string, unknown>>;
  readonly decisions: readonly UnlockDecision[];
  readonly theme: UnlockableTheme;
  readonly overlay: UnlockableOverlayConfig;
  readonly registerUnlockable: (definition: UnlockableDefinition) => () => void;
  readonly registerElement: (id: string, element: HTMLElement | null) => void;
  readonly registerOverlayTarget: (id: string, element: HTMLElement | null) => void;
  readonly completeUnlock: (id: string) => void;
  readonly confirmUnlock: (id: string) => void;
  readonly skipUnlocks: () => void;
  readonly emitEvent: (event: string) => void;
  readonly addSignal: (signal: string) => void;
  readonly removeSignal: (signal: string) => void;
  readonly setUserArchetypes: (archetypes: readonly string[]) => void;
  readonly setFlag: (key: string, value: unknown) => void;
  readonly dismissOverlay: (id: string) => void;
  readonly isOverlayDismissed: (id: string) => boolean;
  readonly isPersistedUnlocked: (id: string) => boolean;
}

export interface UnlockableProviderProps {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly storage?: UnlockableStorageAdapter;
  readonly theme?: UnlockableTheme;
  readonly overlay?: UnlockableOverlayConfig;
  readonly resolver?: UnlockResolver;
  readonly initialEvents?: readonly string[];
  readonly initialSignals?: readonly string[];
  readonly initialUserArchetypes?: readonly string[];
  readonly initialFlags?: Readonly<Record<string, unknown>>;
  readonly onDecision?: (decision: UnlockDecision) => void;
  readonly onStatusChange?: (id: string, status: UnlockStatus, previousStatus: UnlockStatus | undefined) => void;
  readonly onCatalogChange?: (catalog: readonly SerializableUnlockableDefinition[]) => void;
}

const defaultTheme: UnlockableTheme = {
  className: 'unlockable-provider',
  defaultEffect: { name: 'reveal', className: 'unlockable-effect-reveal', durationMs: 1200, timeoutMs: 1400 },
  overlay: {
    kind: 'coach',
    primaryActionLabel: 'Unlock',
    dismissActionLabel: 'Not now',
    dismissible: true,
  },
};

const defaultResolver = createLocalUnlockableResolver();
const UnlockableContext = createContext<UnlockableContextValue | null>(null);

export function UnlockableProvider({
  appId = 'default',
  children,
  storage,
  theme,
  overlay,
  resolver = defaultResolver,
  initialEvents = [],
  initialSignals = [],
  initialUserArchetypes = [],
  initialFlags = {},
  onDecision,
  onStatusChange,
  onCatalogChange,
}: UnlockableProviderProps) {
  const storageAdapter = useMemo(() => storage ?? createLocalStorageAdapter(), [storage]);
  const mergedTheme = useMemo<UnlockableTheme>(() => mergeTheme(defaultTheme, theme), [theme]);
  const mergedOverlay = useMemo<UnlockableOverlayConfig>(
    () => ({ ...(mergedTheme.overlay ?? {}), ...(overlay ?? {}) }),
    [mergedTheme.overlay, overlay],
  );
  const [registry, setRegistry] = useState<Record<string, RegistryEntry>>({});
  const registryRef = useRef(registry);
  const [unlockState, setUnlockState] = useState<UnlockState>({ statusById: {}, skipped: false });
  const [hydratedDefinitionSignature, setHydratedDefinitionSignature] = useState('');
  const [events, setEvents] = useState<readonly string[]>(initialEvents);
  const [signals, setSignals] = useState<readonly string[]>(initialSignals);
  const [userArchetypes, setUserArchetypesState] = useState<readonly string[]>(initialUserArchetypes);
  const [flags, setFlags] = useState<Readonly<Record<string, unknown>>>(initialFlags);
  const [decisions, setDecisions] = useState<readonly UnlockDecision[]>([]);
  const [dismissedOverlays, setDismissedOverlays] = useState<ReadonlySet<string>>(() => new Set());
  const elementRefs = useRef(new Map<string, HTMLElement>());
  const overlayRefs = useRef(new Map<string, HTMLElement>());
  const previousStatuses = useRef<Readonly<Record<string, UnlockStatus>>>({});
  const resolverRun = useRef(0);

  const definitions = useMemo(
    () => Object.values(registry).map((entry) => entry.definition),
    [registry],
  );
  const definitionSignature = useMemo(() => definitions.map((definition) => definition.id).sort().join('|'), [definitions]);

  const catalog = useMemo(
    () => createSerializableCatalog(definitions, { warn: isDevelopment() ? console.warn : undefined }),
    [definitions],
  );

  useEffect(() => {
    registryRef.current = registry;
  }, [registry]);

  useEffect(() => {
    onCatalogChange?.(catalog);
  }, [catalog, onCatalogChange]);

  useEffect(() => {
    const hydrated = loadUnlockState(appId, definitions, storageAdapter);
    setUnlockState((current) => {
      const next = evaluateState(
        definitions,
        buildContext(current.statusById, events, userArchetypes, signals, flags, decisions),
        current,
        hydrated,
        isDevelopment() ? console.warn : undefined,
      );
      return areUnlockStatesEqual(current, next) ? current : next;
    });
    setHydratedDefinitionSignature(definitionSignature);
  }, [appId, definitionSignature, definitions, storageAdapter, events, userArchetypes, signals, flags, decisions]);

  useEffect(() => {
    if (definitions.length === 0 || hydratedDefinitionSignature !== definitionSignature) {
      return;
    }
    saveUnlockState(appId, unlockState, storageAdapter);
  }, [appId, definitionSignature, definitions.length, hydratedDefinitionSignature, storageAdapter, unlockState]);

  useEffect(() => {
    const currentStatuses = unlockState.statusById;
    const previous = previousStatuses.current;
    for (const [id, status] of Object.entries(currentStatuses)) {
      if (previous[id] !== status) {
        onStatusChange?.(id, status, previous[id]);
      }
    }
    previousStatuses.current = currentStatuses;
  }, [onStatusChange, unlockState.statusById]);

  useEffect(() => {
    if (definitions.length === 0) {
      setDecisions((current) => (areDecisionsEqual(current, []) ? current : []));
      return;
    }

    const runId = ++resolverRun.current;
    const context = buildContext(unlockState.statusById, events, userArchetypes, signals, flags, decisions);

    Promise.resolve()
      .then(() => resolver(definitions, context))
      .then((nextDecisions) => {
        if (resolverRun.current !== runId) {
          return;
        }
        const normalized = Array.isArray(nextDecisions) ? nextDecisions : [];
        setDecisions((current) => (areDecisionsEqual(current, normalized) ? current : normalized));
        for (const decision of normalized) {
          onDecision?.(decision);
        }
      })
      .catch((error) => {
        if (resolverRun.current !== runId) {
          return;
        }
        console.warn('Unlockable resolver failed; new resolver-based unlocks will stay closed.', error);
        setDecisions((current) => (current.length === 0 ? current : []));
      });
  }, [decisions, definitions, events, flags, onDecision, resolver, signals, unlockState.statusById, userArchetypes]);

  useEffect(() => {
    setUnlockState((current) => {
      let next = current;
      for (const definition of definitions) {
        const status = next.statusById[definition.id];
        const activation = definition.activation ?? 'automatic';
        if (status === 'ELIGIBLE' && activation === 'automatic') {
          next = transitionUnlockStatus(next, definition.id, 'UNLOCKING');
        }
      }
      return next;
    });
  }, [definitions, unlockState.statusById]);

  const registerUnlockable = useCallback((definition: UnlockableDefinition) => {
    const existing = registryRef.current[definition.id];
    if (existing && existing.count > 0 && existing.definition !== definition) {
      const message = `Duplicate unlockable id "${definition.id}" registered.`;
      if (isDevelopment()) {
        throw new Error(message);
      }
      console.warn(message);
    }

    setRegistry((current) => {
      const currentEntry = current[definition.id];
      const nextEntry: RegistryEntry = {
        definition,
        count: (currentEntry?.count ?? 0) + 1,
      };
      const next = { ...current, [definition.id]: nextEntry };
      registryRef.current = next;
      return next;
    });

    return () => {
      setRegistry((current) => {
        const currentEntry = current[definition.id];
        if (!currentEntry) {
          return current;
        }
        const next = { ...current };
        if (currentEntry.count <= 1) {
          delete next[definition.id];
        } else {
          next[definition.id] = { ...currentEntry, count: currentEntry.count - 1 };
        }
        registryRef.current = next;
        return next;
      });
    };
  }, []);

  const registerElement = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      elementRefs.current.set(id, element);
    } else {
      elementRefs.current.delete(id);
    }
  }, []);

  const registerOverlayTarget = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      overlayRefs.current.set(id, element);
    } else {
      overlayRefs.current.delete(id);
    }
  }, []);

  const completeUnlock = useCallback((id: string) => {
    setUnlockState((current) => transitionUnlockStatus(current, id, 'UNLOCKED'));
    globalThis.setTimeout(() => focusUnlockedOrNextTarget(id, elementRefs.current, overlayRefs.current), 0);
  }, []);

  const confirmUnlock = useCallback((id: string) => {
    setUnlockState((current) => {
      const status = current.statusById[id];
      if (status !== 'ELIGIBLE') {
        if (isDevelopment()) {
          console.warn(
            `Cannot confirm unlockable "${id}" because its current status is "${status ?? 'UNKNOWN'}", not "ELIGIBLE".`,
          );
        }
        return current;
      }
      return transitionUnlockStatus(current, id, 'UNLOCKING');
    });
  }, []);

  const skipUnlocks = useCallback(() => {
    setUnlockState((current) => skipUnlockState(current, definitions));
  }, [definitions]);

  const emitEvent = useCallback((event: string) => {
    setEvents((current) => appendUnique(current, event));
  }, []);

  const addSignal = useCallback((signal: string) => {
    setSignals((current) => appendUnique(current, signal));
  }, []);

  const removeSignal = useCallback((signal: string) => {
    setSignals((current) => current.filter((item) => item !== signal));
  }, []);

  const setUserArchetypes = useCallback((archetypes: readonly string[]) => {
    setUserArchetypesState([...archetypes]);
  }, []);

  const setFlag = useCallback((key: string, value: unknown) => {
    setFlags((current) => ({ ...current, [key]: value }));
  }, []);

  const dismissOverlay = useCallback((id: string) => {
    setDismissedOverlays((current) => new Set([...current, id]));
  }, []);

  const isOverlayDismissed = useCallback((id: string) => dismissedOverlays.has(id), [dismissedOverlays]);
  const isPersistedUnlocked = useCallback((id: string) => {
    const persisted = loadUnlockState(appId, definitions, storageAdapter, isDevelopment() ? console.warn : undefined);
    return persisted.statusById[id] === 'UNLOCKED';
  }, [appId, definitions, storageAdapter]);

  const value = useMemo<UnlockableContextValue>(
    () => ({
      appId,
      definitions,
      catalog,
      statusById: unlockState.statusById,
      events,
      signals,
      userArchetypes,
      flags,
      decisions,
      theme: mergedTheme,
      overlay: mergedOverlay,
      registerUnlockable,
      registerElement,
      registerOverlayTarget,
      completeUnlock,
      confirmUnlock,
      skipUnlocks,
      emitEvent,
      addSignal,
      removeSignal,
      setUserArchetypes,
      setFlag,
      dismissOverlay,
      isOverlayDismissed,
      isPersistedUnlocked,
    }),
    [
      addSignal,
      appId,
      catalog,
      completeUnlock,
      confirmUnlock,
      decisions,
      definitions,
      dismissOverlay,
      emitEvent,
      events,
      flags,
      isOverlayDismissed,
      isPersistedUnlocked,
      mergedOverlay,
      mergedTheme,
      registerElement,
      registerOverlayTarget,
      registerUnlockable,
      removeSignal,
      setFlag,
      setUserArchetypes,
      signals,
      skipUnlocks,
      unlockState.statusById,
      userArchetypes,
    ],
  );

  return (
    <UnlockableContext.Provider value={value}>
      <div className={mergedTheme.className} style={tokensToStyle(mergedTheme.tokens)}>
        {children}
      </div>
    </UnlockableContext.Provider>
  );
}

export function useUnlockable(id: string) {
  const context = useUnlockableContext();
  const status = context.statusById[id] ?? 'HIDDEN';
  return {
    id,
    status,
    definition: context.definitions.find((definition) => definition.id === id),
    isHidden: status === 'HIDDEN',
    isEligible: status === 'ELIGIBLE',
    isUnlocking: status === 'UNLOCKING',
    isUnlocked: status === 'UNLOCKED',
    confirmUnlock: () => context.confirmUnlock(id),
    skipUnlocks: context.skipUnlocks,
  };
}

export function useUnlockableCatalog() {
  return useUnlockableContext().catalog;
}

export function useUnlockableSignals() {
  const context = useUnlockableContext();
  return {
    signals: context.signals,
    addSignal: context.addSignal,
    removeSignal: context.removeSignal,
    userArchetypes: context.userArchetypes,
    setUserArchetypes: context.setUserArchetypes,
    flags: context.flags,
    setFlag: context.setFlag,
  };
}

export function useUnlockableEvents() {
  const context = useUnlockableContext();
  return {
    events: context.events,
    emitEvent: context.emitEvent,
  };
}

export function useOptionalUnlockableEvents() {
  const context = useContext(UnlockableContext);
  return {
    events: context?.events ?? [],
    emitEvent: context?.emitEvent ?? (() => undefined),
  };
}

export function useUnlockableContext() {
  const context = useContext(UnlockableContext);
  if (!context) {
    throw new Error('Unlockable hooks must be used within UnlockableProvider.');
  }
  return context;
}

function evaluateState(
  definitions: readonly UnlockableDefinition[],
  context: UnlockContext,
  current: UnlockState,
  hydrated: UnlockState,
  warn: UnlockCriteriaEvaluationOptions['warn'],
): UnlockState {
  if (definitions.length === 0) {
    return { statusById: {}, skipped: current.skipped || hydrated.skipped };
  }

  if (current.skipped || hydrated.skipped) {
    return skipUnlockState(current, definitions);
  }

  const unlockedStatusById = getUnlockedStatusById(definitions, current, hydrated);
  const base = createUnlockState(definitions, {
    ...context,
    statusById: unlockedStatusById,
  });
  const statusById: Record<string, UnlockStatus> = {};

  for (const definition of definitions) {
    const currentStatus = current.statusById[definition.id];
    const hydratedStatus = hydrated.statusById[definition.id];
    if (currentStatus === 'UNLOCKED' || hydratedStatus === 'UNLOCKED') {
      statusById[definition.id] = 'UNLOCKED';
    } else if (isUnlockEligible(definition, { ...context, statusById: { ...base.statusById, ...unlockedStatusById } }, { warn })) {
      statusById[definition.id] = currentStatus === 'UNLOCKING' ? 'UNLOCKING' : 'ELIGIBLE';
    } else {
      statusById[definition.id] = 'HIDDEN';
    }
  }

  return { statusById, skipped: false };
}

function getUnlockedStatusById(
  definitions: readonly UnlockableDefinition[],
  current: UnlockState,
  hydrated: UnlockState,
): Record<string, UnlockStatus> {
  const statusById: Record<string, UnlockStatus> = {};

  for (const definition of definitions) {
    if (current.statusById[definition.id] === 'UNLOCKED' || hydrated.statusById[definition.id] === 'UNLOCKED') {
      statusById[definition.id] = 'UNLOCKED';
    }
  }

  return statusById;
}

function buildContext(
  statusById: Readonly<Record<string, UnlockStatus>>,
  events: readonly string[],
  userArchetypes: readonly string[],
  signals: readonly string[],
  flags: Readonly<Record<string, unknown>>,
  decisions: readonly UnlockDecision[],
): UnlockContext {
  return { events, userArchetypes, signals, flags, state: flags, statusById, decisions };
}

function focusUnlockedOrNextTarget(
  id: string,
  elements: ReadonlyMap<string, HTMLElement>,
  overlayTargets: ReadonlyMap<string, HTMLElement>,
): void {
  const unlocked = elements.get(id);
  if (unlocked) {
    unlocked.focus();
    return;
  }

  for (const [targetId, target] of overlayTargets) {
    if (targetId !== id) {
      target.focus();
      return;
    }
  }
}

function appendUnique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

function areUnlockStatesEqual(left: UnlockState, right: UnlockState): boolean {
  return left.skipped === right.skipped && areStatusMapsEqual(left.statusById, right.statusById);
}

function areStatusMapsEqual(
  left: Readonly<Record<string, UnlockStatus>>,
  right: Readonly<Record<string, UnlockStatus>>,
): boolean {
  const leftEntries = Object.entries(left);
  const rightKeys = Object.keys(right);
  return leftEntries.length === rightKeys.length && leftEntries.every(([id, status]) => right[id] === status);
}

function areDecisionsEqual(left: readonly UnlockDecision[], right: readonly UnlockDecision[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((decision, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      decision.unlockableId === other.unlockableId &&
      decision.unlock === other.unlock &&
      decision.resolverId === other.resolverId &&
      decision.reason === other.reason &&
      decision.confidence === other.confidence &&
      decision.matchedSignals.length === other.matchedSignals.length &&
      decision.matchedSignals.every((signal, signalIndex) => signal === other.matchedSignals[signalIndex])
    );
  });
}

function mergeTheme(base: UnlockableTheme, override: UnlockableTheme | undefined): UnlockableTheme {
  return {
    ...base,
    ...(override ?? {}),
    tokens: { ...(base.tokens ?? {}), ...(override?.tokens ?? {}) },
    overlay: { ...(base.overlay ?? {}), ...(override?.overlay ?? {}) },
  };
}

function tokensToStyle(tokens: Readonly<Record<string, string | number>> | undefined): CSSProperties | undefined {
  if (!tokens) {
    return undefined;
  }

  const style: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(tokens)) {
    style[key.startsWith('--') ? key : `--unlockable-${key}`] = value;
  }
  return style as CSSProperties;
}

function isDevelopment(): boolean {
  return isDevelopmentRuntime();
}
