import type { UnlockContext, UnlockDecision, UnlockResolver, UnlockableDefinition } from './types';

export interface LocalUnlockableResolverOptions {
  readonly resolverId?: string;
}

const DEFAULT_RESOLVER_ID = 'local';

export const EMPTY_UNLOCK_RESOLVER: UnlockResolver = () => [];

export function createLocalUnlockableResolver(options: LocalUnlockableResolverOptions = {}): UnlockResolver {
  const resolverId = normalizeResolverId(options.resolverId);

  return (definitions: readonly UnlockableDefinition[], context: UnlockContext): readonly UnlockDecision[] => {
    const userArchetypes = normalizeList(context.userArchetypes);
    const userArchetypeSet = new Set(userArchetypes);
    const userSignals = normalizeList(context.signals);
    const userSignalSet = new Set(userSignals);
    const decisions: UnlockDecision[] = [];

    for (const definition of definitions) {
      if (definition.autoAssignable !== true) {
        continue;
      }

      const matchedArchetypes = findMatches(normalizeOneOrMany(definition.archetype), userArchetypeSet);
      const matchedMetadataSignals = findMatches(getDefinitionMetadataSignals(definition), userSignalSet);
      const matchedSignals = unique([...matchedArchetypes, ...matchedMetadataSignals]);
      const unlock = matchedSignals.length > 0;

      decisions.push({
        unlockableId: definition.id,
        unlock,
        resolverId,
        reason: createReason(matchedArchetypes, matchedMetadataSignals),
        matchedSignals,
      });
    }

    return decisions;
  };
}

function normalizeResolverId(resolverId: string | undefined): string {
  const normalized = resolverId?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_RESOLVER_ID;
}

function normalizeOneOrMany(value: string | readonly string[] | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }

  return normalizeList(Array.isArray(value) ? value : [value]);
}

function getDefinitionMetadataSignals(definition: UnlockableDefinition): readonly string[] {
  return normalizeList([
    ...(definition.meta.tags ?? []),
    ...(definition.meta.capability === undefined ? [] : [definition.meta.capability]),
    ...(definition.meta.audience ?? []),
  ]);
}

function findMatches(definitionSignals: readonly string[], contextSignals: ReadonlySet<string>): readonly string[] {
  return definitionSignals.filter((signal) => contextSignals.has(signal));
}

function normalizeList(values: readonly string[] | undefined): readonly string[] {
  if (values === undefined) {
    return [];
  }

  return unique(values.map(normalizeString).filter(isString));
}

function normalizeString(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function unique(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function isString(value: string | null): value is string {
  return value !== null;
}

function createReason(matchedArchetypes: readonly string[], matchedMetadataSignals: readonly string[]): string {
  if (matchedArchetypes.length > 0 && matchedMetadataSignals.length > 0) {
    return `Matched archetype(s) ${formatSignals(matchedArchetypes)} and metadata signal(s) ${formatSignals(matchedMetadataSignals)}.`;
  }

  if (matchedArchetypes.length > 0) {
    return `Matched archetype(s): ${formatSignals(matchedArchetypes)}.`;
  }

  if (matchedMetadataSignals.length > 0) {
    return `Matched metadata signal(s): ${formatSignals(matchedMetadataSignals)}.`;
  }

  return 'No auto-assignable archetype or metadata signals matched.';
}

function formatSignals(signals: readonly string[]): string {
  return signals.join(', ');
}
