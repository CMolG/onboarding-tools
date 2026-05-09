export type UnlockStatus = 'HIDDEN' | 'ELIGIBLE' | 'UNLOCKING' | 'UNLOCKED';

export type UnlockableVisibility = 'hidden' | 'placeholder' | 'disabled';

export type UnlockableActivation = 'automatic' | 'manual';

export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | readonly SerializableValue[]
  | { readonly [key: string]: SerializableValue };

export type SerializableRecord = Readonly<Record<string, SerializableValue>>;

export interface UnlockableMeta {
  title: string;
  description: string;
  tags?: readonly string[];
  surface?: string;
  priority?: number;
  capability?: string;
  audience?: readonly string[];
  rationale?: string;
}

export interface UnlockableDefinition {
  id: string;
  archetype?: string | readonly string[];
  autoAssignable?: boolean;
  meta: UnlockableMeta;
  unlocksOn?: UnlockCriteria;
  visibility?: UnlockableVisibility;
  activation?: UnlockableActivation;
  effect?: UnlockEffect;
  tutorial?: UnlockableTutorialConfig;
  flow?: UnlockableFlowConfig;
}

export type UnlockEffect = string | SerializableRecord;

export type UnlockOverlayKind = 'coach' | 'spotlight' | 'none';

export interface UnlockableOverlayConfig {
  kind?: UnlockOverlayKind;
  title?: string;
  body?: string;
  primaryActionLabel?: string;
  dismissActionLabel?: string;
  dismissible?: boolean;
  className?: string;
}

export interface UnlockableTutorialConfig {
  overlay?: UnlockableOverlayConfig;
  title?: string;
  body?: string;
  primaryActionLabel?: string;
  dismissActionLabel?: string;
  dismissible?: boolean;
  kind?: UnlockOverlayKind;
  steps?: readonly UnlockTutorialStep[];
}

export interface UnlockTutorialStep {
  target?: string;
  route?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightCenter?: boolean;
  highlightViewport?: boolean;
  action?: {
    readonly kind: 'next' | 'confirmUnlock' | 'focusTarget' | 'clickTarget';
    readonly label?: string;
  };
}

export interface UnlockableFlowConfig {
  stage?: string;
  route?: string;
  target?: string;
  order?: number;
  required?: boolean;
  completionEvent?: string;
  actionLabel?: string;
}

export interface UnlockableTheme {
  className?: string;
  tokens?: Readonly<Record<string, string | number>>;
  defaultEffect?: UnlockEffect;
  overlay?: UnlockableOverlayConfig;
}

export interface UnlockableStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export type UnlockCriteria = UnlockCriterion;

export type UnlockCriterion =
  | { readonly all: readonly UnlockCriterion[] }
  | { readonly any: readonly UnlockCriterion[] }
  | { readonly not: UnlockCriterion }
  | { readonly kind: 'event'; readonly event: string }
  | { readonly kind: 'archetype'; readonly value: string }
  | { readonly kind: 'flag'; readonly key: string; readonly value?: SerializableValue }
  | { readonly kind: 'state'; readonly key: string; readonly equals: SerializableValue }
  | { readonly kind: 'unlockable'; readonly id: string; readonly status?: UnlockStatus | Lowercase<UnlockStatus> }
  | { readonly kind: 'resolver'; readonly resolverId: string };

export interface UnlockDecision {
  unlockableId: string;
  unlock: boolean;
  resolverId: string;
  reason: string;
  matchedSignals: readonly string[];
  confidence?: number;
}

export interface UnlockContext {
  events?: readonly string[];
  userArchetypes?: readonly string[];
  signals?: readonly string[];
  flags?: Readonly<Record<string, unknown>>;
  state?: Readonly<Record<string, unknown>>;
  statusById?: Readonly<Record<string, UnlockStatus>>;
  decisions?: readonly UnlockDecision[];
}

export type UnlockResolver = (
  definitions: readonly UnlockableDefinition[],
  context: UnlockContext,
) => readonly UnlockDecision[] | Promise<readonly UnlockDecision[]>;
