import type { UnlockCriterion, UnlockableDefinition } from './types';

export interface UnlockableFlowStage {
  readonly id: string;
  readonly title: string;
  readonly definition: UnlockableDefinition;
  readonly completionEvent?: string;
  readonly dependsOn: readonly string[];
  readonly route?: string;
  readonly target?: string;
  readonly order: number;
  readonly required: boolean;
}

export type FlowDerivationResult =
  | { readonly ok: true; readonly stages: readonly UnlockableFlowStage[]; readonly errors: readonly [] }
  | { readonly ok: false; readonly stages: readonly UnlockableFlowStage[]; readonly errors: readonly string[] };

const DEFAULT_ORDER = Number.MAX_SAFE_INTEGER;

export function deriveUnlockableFlow(definitions: readonly UnlockableDefinition[]): FlowDerivationResult {
  const flowDefinitions = definitions.filter((definition) => definition.flow);
  const errors: string[] = [];
  const eventOwners = new Map<string, string>();

  for (const definition of flowDefinitions) {
    const event = definition.flow?.completionEvent;
    if (!event) {
      continue;
    }

    const owner = eventOwners.get(event);
    if (owner) {
      errors.push(`Duplicate completion event "${event}" declared by "${owner}" and "${definition.id}".`);
      continue;
    }
    eventOwners.set(event, definition.id);
  }

  const stages = flowDefinitions.map<UnlockableFlowStage>((definition) => {
    const eventDependencies = extractEventCriteria(definition.unlocksOn);
    const dependsOn = Array.from(
      new Set(
        eventDependencies
          .map((event) => {
            const owner = eventOwners.get(event);
            if (!owner) {
              errors.push(`Unknown completion event "${event}" referenced by "${definition.id}".`);
              return null;
            }
            return owner === definition.id ? null : owner;
          })
          .filter((id): id is string => typeof id === 'string'),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return {
      id: definition.id,
      title: definition.flow?.stage ?? definition.meta.title,
      definition,
      completionEvent: definition.flow?.completionEvent,
      dependsOn,
      route: definition.flow?.route,
      target: definition.flow?.target,
      order: definition.flow?.order ?? DEFAULT_ORDER,
      required: definition.flow?.required ?? true,
    };
  });

  const sorted = sortStages(stages, errors);

  if (errors.length > 0) {
    return { ok: false, stages: sorted, errors };
  }

  return { ok: true, stages: sorted, errors: [] };
}

function extractEventCriteria(criterion: UnlockCriterion | undefined): readonly string[] {
  if (!criterion) {
    return [];
  }

  if ('all' in criterion) {
    return criterion.all.flatMap(extractEventCriteria);
  }

  if ('any' in criterion) {
    return criterion.any.flatMap(extractEventCriteria);
  }

  if ('not' in criterion) {
    return extractEventCriteria(criterion.not);
  }

  return criterion.kind === 'event' ? [criterion.event] : [];
}

function sortStages(stages: readonly UnlockableFlowStage[], errors: string[]): readonly UnlockableFlowStage[] {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  const remaining = new Set(stages.map((stage) => stage.id));
  const sorted: UnlockableFlowStage[] = [];

  while (remaining.size > 0) {
    const ready = Array.from(remaining)
      .map((id) => byId.get(id))
      .filter((stage): stage is UnlockableFlowStage => Boolean(stage))
      .filter((stage) => stage.dependsOn.every((dependency) => !remaining.has(dependency)));

    if (ready.length === 0) {
      errors.push(`Unlockable flow contains a dependency cycle: ${Array.from(remaining).sort().join(' -> ')}.`);
      break;
    }

    ready.sort(compareStages);
    const next = ready[0];
    sorted.push(next);
    remaining.delete(next.id);
  }

  if (remaining.size > 0) {
    const unresolved = Array.from(remaining)
      .map((id) => byId.get(id))
      .filter((stage): stage is UnlockableFlowStage => Boolean(stage))
      .sort(compareStages);
    sorted.push(...unresolved);
  }

  return sorted;
}

function compareStages(left: UnlockableFlowStage, right: UnlockableFlowStage): number {
  return left.order - right.order || left.id.localeCompare(right.id);
}
