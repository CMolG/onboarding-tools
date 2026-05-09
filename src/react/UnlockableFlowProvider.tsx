import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { deriveUnlockableFlow, type UnlockableFlowStage } from '../core/flow';
import { isDevelopmentRuntime } from '../env';
import { useUnlockableContext } from './UnlockableProvider';
import type { OnboardingRouterAdapter } from './router';

interface UnlockableFlowContextValue {
  readonly stages: readonly UnlockableFlowStage[];
  readonly errors: readonly string[];
  readonly activeStage: UnlockableFlowStage | null;
  readonly completedEvents: readonly string[];
  readonly router?: OnboardingRouterAdapter;
  readonly isStageComplete: (stageId: string) => boolean;
  readonly getStageByUnlockableId: (id: string) => UnlockableFlowStage | undefined;
}

export interface UnlockableFlowProviderProps {
  readonly children: ReactNode;
  readonly router?: OnboardingRouterAdapter;
}

export interface UnlockableFlowRouteGateProps {
  readonly stageId: string;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly router?: OnboardingRouterAdapter;
}

const UnlockableFlowContext = createContext<UnlockableFlowContextValue | null>(null);

export function UnlockableFlowProvider({ children, router }: UnlockableFlowProviderProps) {
  const unlockable = useUnlockableContext();
  const derivation = useMemo(() => deriveUnlockableFlow(unlockable.definitions), [unlockable.definitions]);
  const stages = derivation.stages;
  const errors = useMemo(() => (derivation.ok ? [] : derivation.errors), [derivation]);
  const completedEvents = unlockable.events;

  const isStageComplete = useMemo(() => {
    return (stageId: string) => {
      const stage = stages.find((item) => item.id === stageId);
      if (!stage) {
        return false;
      }

      const status = unlockable.statusById[stage.id];
      const activation = stage.definition.activation ?? 'automatic';

      if (!stage.completionEvent) {
        return status === 'UNLOCKED';
      }

      const eventCompleted = completedEvents.includes(stage.completionEvent);
      if (activation === 'manual') {
        return eventCompleted && status === 'UNLOCKED';
      }

      return eventCompleted;
    };
  }, [completedEvents, stages, unlockable.statusById]);

  const activeStage = useMemo(
    () => stages.find((stage) => stage.required && !isStageComplete(stage.id)) ?? null,
    [isStageComplete, stages],
  );

  const value = useMemo<UnlockableFlowContextValue>(
    () => ({
      stages,
      errors,
      activeStage,
      completedEvents,
      router,
      isStageComplete,
      getStageByUnlockableId: (id) => stages.find((stage) => stage.id === id),
    }),
    [activeStage, completedEvents, errors, isStageComplete, router, stages],
  );

  if (errors.length > 0 && isDevelopmentRuntime()) {
    console.warn('Unlockable flow derivation failed.', errors);
  }

  return <UnlockableFlowContext.Provider value={value}>{children}</UnlockableFlowContext.Provider>;
}

export function UnlockableFlowRouteGate({ stageId, children, fallback = null, router: routerProp }: UnlockableFlowRouteGateProps) {
  const flow = useUnlockableFlow();
  const unlockable = useUnlockableContext();
  const router = routerProp ?? flow.router;
  const stage = flow.getStageByUnlockableId(stageId);
  const activeRoute = flow.activeStage?.route;
  const persistedUnlocked = unlockable.statusById[stageId] === 'UNLOCKED' || unlockable.isPersistedUnlocked(stageId);

  useEffect(() => {
    if (activeRoute && router && activeRoute !== router.pathname) {
      router.navigate(activeRoute, { replace: true });
    }
  }, [activeRoute, router]);

  if (!stage || persistedUnlocked || flow.isStageComplete(stageId) || flow.activeStage?.id === stageId) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function useUnlockableFlow() {
  const context = useContext(UnlockableFlowContext);
  if (!context) {
    throw new Error('Unlockable flow hooks must be used within UnlockableFlowProvider.');
  }
  return context;
}

export function useOptionalUnlockableFlow() {
  return useContext(UnlockableFlowContext);
}
