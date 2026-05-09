import type { UnlockContext, UnlockCriteria, UnlockCriterion, UnlockStatus, UnlockableDefinition } from './types';

export interface UnlockCriteriaEvaluationOptions {
  readonly warn?: (message: string, details?: unknown) => void;
}

export function isUnlockEligible(
  definition: UnlockableDefinition,
  context: UnlockContext,
  options: UnlockCriteriaEvaluationOptions = {},
): boolean {
  if (definition.unlocksOn === undefined) {
    return true;
  }

  return evaluateCriterion(definition.unlocksOn, context, definition.id, options);
}

function evaluateCriterion(
  criterion: UnlockCriteria | UnlockCriterion,
  context: UnlockContext,
  unlockableId: string,
  options: UnlockCriteriaEvaluationOptions,
): boolean {
  if (!isRecord(criterion)) {
    warnInvalidCriterion(options, unlockableId, 'Unlock criteria must be an object.', criterion);
    return false;
  }

  if ('all' in criterion) {
    if (!Array.isArray(criterion.all)) {
      warnInvalidCriterion(options, unlockableId, 'Unlock criteria "all" must be an array.', criterion);
      return false;
    }
    return criterion.all.every((child) => evaluateCriterion(child, context, unlockableId, options));
  }

  if ('any' in criterion) {
    if (!Array.isArray(criterion.any)) {
      warnInvalidCriterion(options, unlockableId, 'Unlock criteria "any" must be an array.', criterion);
      return false;
    }
    return criterion.any.some((child) => evaluateCriterion(child, context, unlockableId, options));
  }

  if ('not' in criterion) {
    if (!isRecord(criterion.not)) {
      warnInvalidCriterion(options, unlockableId, 'Unlock criteria "not" must be an object.', criterion);
      return false;
    }
    return !evaluateCriterion(criterion.not, context, unlockableId, options);
  }

  if (!('kind' in criterion)) {
    warnInvalidCriterion(options, unlockableId, 'Unlock criteria must include a kind.', criterion);
    return false;
  }

  switch (criterion.kind) {
    case 'event':
      return context.events?.includes(criterion.event) ?? false;
    case 'archetype':
      return context.userArchetypes?.includes(criterion.value) ?? false;
    case 'flag': {
      if (!context.flags || !(criterion.key in context.flags)) {
        return false;
      }

      const actual = context.flags[criterion.key];
      return 'value' in criterion ? areEqual(actual, criterion.value) : Boolean(actual);
    }
    case 'state':
      return context.state ? areEqual(context.state[criterion.key], criterion.equals) : false;
    case 'unlockable': {
      const expectedStatus = normalizeStatus(criterion.status);
      if (expectedStatus === null) {
        warnInvalidCriterion(options, unlockableId, 'Unlockable criterion status is invalid.', criterion);
        return false;
      }
      return expectedStatus !== null && context.statusById?.[criterion.id] === expectedStatus;
    }
    case 'resolver':
      return (
        context.decisions?.some(
          (decision) =>
            decision.unlockableId === unlockableId &&
            decision.resolverId === criterion.resolverId &&
            decision.unlock,
        ) ?? false
      );
    default:
      warnInvalidCriterion(
        options,
        unlockableId,
        `Unknown unlock criterion kind "${String((criterion as Readonly<Record<string, unknown>>).kind)}".`,
        criterion,
      );
      return false;
  }
}

function warnInvalidCriterion(
  options: UnlockCriteriaEvaluationOptions,
  unlockableId: string,
  reason: string,
  details: unknown,
): void {
  options.warn?.(`Invalid unlock criteria for "${unlockableId}": ${reason} New unlocks will stay closed.`, details);
}

function areEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => areEqual(item, right[index]));
  }

  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && areEqual(left[key], right[key]))
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStatus(status: UnlockStatus | Lowercase<UnlockStatus> | undefined): UnlockStatus | null {
  switch (status) {
    case undefined:
      return 'UNLOCKED';
    case 'hidden':
    case 'HIDDEN':
      return 'HIDDEN';
    case 'eligible':
    case 'ELIGIBLE':
      return 'ELIGIBLE';
    case 'unlocking':
    case 'UNLOCKING':
      return 'UNLOCKING';
    case 'unlocked':
    case 'UNLOCKED':
      return 'UNLOCKED';
    default:
      return null;
  }
}
