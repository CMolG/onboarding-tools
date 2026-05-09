import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useUnlockable, useUnlockableContext, useUnlockableEvents } from './UnlockableProvider';
import { useUnlockableFlow } from './UnlockableFlowProvider';
import type { OnboardingRouterAdapter } from './router';
import { UnlockableTutorialEngineContext } from './tutorialContext';
import type { UnlockTutorialStep } from '../core/types';

const VIEWPORT_MARGIN = 24;
const CARD_WIDTH = 340;
const CARD_HEIGHT = 230;
const MAX_MISSES = 90;
const SPOTLIGHT_PADDING = 8;

export interface UnlockableTutorialEngineProviderProps {
  readonly children: ReactNode;
  readonly router?: OnboardingRouterAdapter;
  readonly isRouteDisabled?: (pathname: string) => boolean;
}

export function UnlockableTutorialEngineProvider({ children, router, isRouteDisabled }: UnlockableTutorialEngineProviderProps) {
  return (
    <UnlockableTutorialEngineContext.Provider value>
      {children}
      <UnlockableTutorialEngine router={router} isRouteDisabled={isRouteDisabled} />
    </UnlockableTutorialEngineContext.Provider>
  );
}

export interface UnlockableTutorialEngineProps {
  readonly router?: OnboardingRouterAdapter;
  readonly isRouteDisabled?: (pathname: string) => boolean;
}

export function UnlockableTutorialEngine({ router: routerProp, isRouteDisabled }: UnlockableTutorialEngineProps) {
  const flow = useUnlockableFlow();
  const unlockableContext = useUnlockableContext();
  const router = routerProp ?? flow.router;
  const pathname = router?.pathname ?? '';
  const activeStage = flow.activeStage;
  const currentRouteStage = router ? flow.stages.find((stage) => stage.route === pathname) : undefined;
  const activeStageIndex = activeStage ? flow.stages.findIndex((stage) => stage.id === activeStage.id) : -1;
  const currentRouteStageIndex = currentRouteStage ? flow.stages.findIndex((stage) => stage.id === currentRouteStage.id) : -1;
  const routeIsAheadOfActive = currentRouteStageIndex >= 0 && activeStageIndex >= 0 && currentRouteStageIndex > activeStageIndex;
  const shouldNavigateToActiveStage = Boolean(router) && (!currentRouteStage || currentRouteStageIndex < activeStageIndex);
  const activeStageAlreadyUnlocked = Boolean(
    activeStage && (
      unlockableContext.statusById[activeStage.id] === 'UNLOCKED' ||
      unlockableContext.isPersistedUnlocked(activeStage.id)
    ),
  );
  const routeStageAlreadyUnlocked = Boolean(
    currentRouteStage && currentRouteStage.id === activeStage?.id && (
      unlockableContext.statusById[currentRouteStage.id] === 'UNLOCKED' ||
      unlockableContext.isPersistedUnlocked(currentRouteStage.id)
    ),
  );
  const disabledForRoute = Boolean(
    (router && isRouteDisabled?.(pathname)) ||
    activeStageAlreadyUnlocked ||
    routeIsAheadOfActive ||
    routeStageAlreadyUnlocked
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissedStageIds, setDismissedStageIds] = useState<ReadonlySet<string>>(() => new Set());
  const [activationAnnouncementStageId, setActivationAnnouncementStageId] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [fallback, setFallback] = useState(false);
  const rafRef = useRef(0);
  const pendingActivationAnnouncements = useRef(new Set<string>());
  const acknowledgedActivationAnnouncements = useRef(new Set<string>());

  const unlockable = useUnlockable(activeStage?.id ?? '__none__');
  const { events } = useUnlockableEvents();
  const activeStageNeedsActivationAnnouncement = Boolean(
    activeStage &&
    activeStage.definition.activation === 'manual' &&
    unlockableContext.statusById[activeStage.id] === 'UNLOCKED' &&
    activeStage.completionEvent &&
    !events.includes(activeStage.completionEvent) &&
    !acknowledgedActivationAnnouncements.current.has(activeStage.id),
  );
  const activationAnnouncementStage = activationAnnouncementStageId
    ? flow.stages.find((stage) => stage.id === activationAnnouncementStageId) ?? null
    : activeStageNeedsActivationAnnouncement
      ? activeStage
    : null;
  const activationAnnouncementCompleted = Boolean(
    activationAnnouncementStage?.completionEvent &&
    events.includes(activationAnnouncementStage.completionEvent),
  );
  const isActivationAnnouncement = Boolean(activationAnnouncementStage && !activationAnnouncementCompleted);
  const renderStage = activationAnnouncementStage ?? activeStage;
  const tutorial = activeStage?.definition.tutorial;
  const manualActivationPending = Boolean(
    activeStage &&
    activeStage.definition.activation === 'manual' &&
    unlockable.status === 'ELIGIBLE' &&
    !flow.isStageComplete(activeStage.id) &&
    !pendingActivationAnnouncements.current.has(activeStage.id) &&
    !acknowledgedActivationAnnouncements.current.has(activeStage.id),
  );
  const steps = useMemo(() => {
    if (activationAnnouncementStage) {
      return [{
        target: activationAnnouncementStage.target,
        route: activationAnnouncementStage.route,
        title: `${activationAnnouncementStage.title} enabled`,
        description: `${activationAnnouncementStage.definition.meta.description} It is now available in the workspace.`,
        position: activationAnnouncementStage.definition.tutorial?.steps?.[0]?.position ?? 'right',
        action: { kind: 'next', label: activationAnnouncementStage.completionEvent ? 'Continue' : 'Done' },
      }] satisfies readonly UnlockTutorialStep[];
    }

    if (!activeStage) {
      return [];
    }
    if (tutorial?.steps?.length) {
      return tutorial.steps;
    }
    return [{
      target: activeStage.target,
      route: activeStage.route,
      title: tutorial?.title ?? activeStage.title,
      description: tutorial?.body ?? activeStage.definition.meta.description,
      position: 'center',
      action: { kind: activeStage.definition.activation === 'manual' ? 'confirmUnlock' : 'next' },
    }] satisfies readonly UnlockTutorialStep[];
  }, [activationAnnouncementStage, activeStage, tutorial]);

  const preActivationVisible = Boolean(
    activeStage &&
    tutorial?.kind !== 'none' &&
    !dismissedStageIds.has(activeStage.id) &&
    steps.length > 0 &&
    !flow.isStageComplete(activeStage.id) &&
    unlockable.status !== 'UNLOCKED' &&
    activeStage.definition.activation !== 'manual' &&
    (unlockable.status === 'ELIGIBLE' || activeStage.definition.activation === 'automatic'),
  );
  const visible = isActivationAnnouncement || preActivationVisible;

  const step = steps[stepIndex] ?? steps[0];
  const targetSelector = step?.target ?? renderStage?.target;
  const route = step?.route ?? renderStage?.route;

  useEffect(() => {
    setStepIndex(0);
    setTargetRect(null);
    setFallback(false);
  }, [renderStage?.id, isActivationAnnouncement]);

  useEffect(() => {
    if (!activeStage) {
      return;
    }

    if (
      pendingActivationAnnouncements.current.has(activeStage.id) &&
      !acknowledgedActivationAnnouncements.current.has(activeStage.id) &&
      unlockableContext.statusById[activeStage.id] === 'UNLOCKED' &&
      !activationAnnouncementStageId
    ) {
      pendingActivationAnnouncements.current.delete(activeStage.id);
      setActivationAnnouncementStageId(activeStage.id);
    }
  }, [activationAnnouncementStageId, activeStage, unlockableContext.statusById]);

  useEffect(() => {
    if (activationAnnouncementCompleted) {
      setActivationAnnouncementStageId(null);
    }
  }, [activationAnnouncementCompleted]);

  useEffect(() => {
    if (!activeStage || !manualActivationPending) {
      return;
    }

    if (router && activeStage.route && activeStage.route !== pathname) {
      router.navigate(activeStage.route);
      return;
    }

    pendingActivationAnnouncements.current.add(activeStage.id);
    unlockable.confirmUnlock();
  }, [activeStage, manualActivationPending, pathname, router, unlockable]);

  useEffect(() => {
    if (isActivationAnnouncement || disabledForRoute || !shouldNavigateToActiveStage || !visible || !route || route === pathname) {
      return;
    }
    router?.navigate(route);
  }, [disabledForRoute, isActivationAnnouncement, pathname, route, router, shouldNavigateToActiveStage, visible]);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let misses = 0;
    const track = () => {
      if (!targetSelector) {
        setFallback(true);
        return;
      }

      const target = document.querySelector(targetSelector);
      if (target) {
        setTargetRect(normalizeRect(target.getBoundingClientRect()));
        setFallback(false);
        misses = 0;
      } else {
        misses += 1;
        if (misses >= MAX_MISSES) {
          setFallback(true);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(track);
    };

    rafRef.current = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetSelector, visible, pathname]);

  const closeStage = useCallback(() => {
    if (!renderStage) {
      return;
    }
    setDismissedStageIds((current) => new Set([...current, renderStage.id]));
  }, [renderStage]);

  const completeActivationAnnouncement = useCallback(() => {
    if (!renderStage) {
      return;
    }
    const completionEvent = renderStage.completionEvent ?? renderStage.definition.flow?.completionEvent;
    if (completionEvent && !events.includes(completionEvent)) {
      unlockableContext.emitEvent(completionEvent);
    }
    acknowledgedActivationAnnouncements.current.add(renderStage.id);
    pendingActivationAnnouncements.current.delete(renderStage.id);
    setActivationAnnouncementStageId(null);
  }, [events, renderStage, unlockableContext]);

  const handleAction = useCallback(() => {
    if (!renderStage || !step) {
      return;
    }

    const shouldCompleteActivationAnnouncement = Boolean(
      renderStage.definition.activation === 'manual' &&
      unlockableContext.statusById[renderStage.id] === 'UNLOCKED' &&
      renderStage.completionEvent &&
      !events.includes(renderStage.completionEvent),
    );

    if (isActivationAnnouncement || shouldCompleteActivationAnnouncement) {
      completeActivationAnnouncement();
      return;
    }

    const action = step.action?.kind ?? (stepIndex < steps.length - 1 ? 'next' : 'confirmUnlock');
    if (action === 'next') {
      if (stepIndex >= steps.length - 1) {
        closeStage();
      } else {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      }
      return;
    }

    if (action === 'focusTarget') {
      const target = targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null;
      target?.focus();
      if (stepIndex >= steps.length - 1) {
        closeStage();
      } else {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      }
      return;
    }

    if (action === 'clickTarget') {
      const target = targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null;
      target?.click();
      if (stepIndex >= steps.length - 1) {
        closeStage();
      } else {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      }
      return;
    }

    pendingActivationAnnouncements.current.add(renderStage.id);
    unlockable.confirmUnlock();
    closeStage();
  }, [closeStage, completeActivationAnnouncement, events, isActivationAnnouncement, renderStage, step, stepIndex, steps.length, targetSelector, unlockable, unlockableContext]);

  if ((!isActivationAnnouncement && disabledForRoute) || !visible || !renderStage || !step || (!targetRect && !fallback)) {
    return null;
  }

  const rect = fallback ? centeredRect() : targetRect ?? centeredRect();
  const cardStyle = getCardStyle(rect, step.position ?? 'center');
  const actionLabel = step.action?.label ?? tutorial?.primaryActionLabel ?? (stepIndex === steps.length - 1 ? 'Unlock' : 'Next');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${renderStage.id}-tutorial-title`}
      data-testid="unlockable-tutorial-dialog"
      data-unlockable-tutorial={renderStage.id}
      data-unlockable-tutorial-phase={isActivationAnnouncement ? 'activated' : 'pre-activation'}
      data-unlockable-events={events.join(',')}
      className="ot-tutorial-root"
    >
      <Spotlight rect={rect} fallback={fallback} />
      <div className="ot-tutorial-click-shield" onClick={(event) => event.stopPropagation()} />
      <section
        className="ot-tutorial-card"
        style={cardStyle}
      >
        <div className="ot-tutorial-progress">
          {stepIndex + 1} / {steps.length}
        </div>
        <h2 id={`${renderStage.id}-tutorial-title`} className="ot-tutorial-title">
          {step.title}
        </h2>
        <p className="ot-tutorial-body">{step.description}</p>
        {fallback ? (
          <p className="ot-tutorial-note">The highlighted target is not visible yet, so this step is shown as a centered guide.</p>
        ) : null}
        <div className="ot-tutorial-actions">
          {!isActivationAnnouncement ? (
            <button
              type="button"
              onClick={closeStage}
              className="ot-button ot-button-secondary"
            >
              {tutorial?.dismissActionLabel ?? 'Skip'}
            </button>
          ) : null}
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              className="ot-button ot-button-secondary"
            >
              Prev
            </button>
          ) : null}
          <button
            type="button"
            onClick={isActivationAnnouncement ? completeActivationAnnouncement : handleAction}
            className="ot-button ot-button-primary"
          >
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function Spotlight({ rect, fallback }: { readonly rect: DOMRect; readonly fallback: boolean }) {
  const pad = fallback ? 0 : SPOTLIGHT_PADDING;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const x = clamp(rect.left - pad, 0, viewportWidth);
  const y = clamp(rect.top - pad, 0, viewportHeight);
  const right = clamp(rect.right + pad, 0, viewportWidth);
  const bottom = clamp(rect.bottom + pad, 0, viewportHeight);
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);

  return (
    <div className="ot-tutorial-spotlight" data-testid="unlockable-tutorial-spotlight">
      <svg
        width={viewportWidth}
        height={viewportHeight}
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        preserveAspectRatio="none"
        className="ot-tutorial-mask"
        aria-hidden="true"
      >
        <defs>
          <mask
            id="unlockable-tutorial-mask"
            x={0}
            y={0}
            width={viewportWidth}
            height={viewportHeight}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
          >
            <rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill="white" />
            <rect x={x} y={y} width={width} height={height} rx={12} fill="black" />
          </mask>
        </defs>
        <rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill="var(--ot-color-backdrop)" mask="url(#unlockable-tutorial-mask)" />
      </svg>
      <div
        className="ot-tutorial-spotlight-ring"
        data-spotlight-left={Math.round(x)}
        data-spotlight-top={Math.round(y)}
        data-spotlight-width={Math.round(width)}
        data-spotlight-height={Math.round(height)}
        style={{ left: x, top: y, width, height }}
      />
    </div>
  );
}

function centeredRect(): DOMRect {
  return new DOMRect(window.innerWidth / 2 - 140, window.innerHeight / 2 - 80, 280, 160);
}

function normalizeRect(rect: DOMRect): DOMRect {
  const left = clamp(rect.left, 0, window.innerWidth);
  const top = clamp(rect.top, 0, window.innerHeight);
  const right = clamp(rect.right, left, window.innerWidth);
  const bottom = clamp(rect.bottom, top, window.innerHeight);
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

function getCardStyle(rect: DOMRect, position: UnlockTutorialStep['position']): CSSProperties {
  if (position === 'center') {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  const cardWidth = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const cardHeight = Math.min(CARD_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2);
  const candidates = orderPositions(position ?? 'bottom').map((candidate) =>
    getPositionedCardRect(rect, candidate, cardWidth, cardHeight)
  );
  const preferred = candidates.find((candidate) => !rectsOverlap(candidate, rect)) ?? candidates[0];

  return { left: preferred.left, top: preferred.top };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

type CardPosition = Exclude<UnlockTutorialStep['position'], 'center' | undefined>;

function orderPositions(preferred: CardPosition): readonly CardPosition[] {
  const fallbackOrder: readonly CardPosition[] = ['right', 'bottom', 'left', 'top'];
  return [preferred, ...fallbackOrder.filter((position) => position !== preferred)];
}

function getPositionedCardRect(rect: DOMRect, position: CardPosition, cardWidth: number, cardHeight: number): DOMRect {
  const centeredLeft = rect.left + rect.width / 2 - cardWidth / 2;
  const centeredTop = rect.top + rect.height / 2 - cardHeight / 2;
  const maxLeft = window.innerWidth - cardWidth - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - cardHeight - VIEWPORT_MARGIN;

  if (position === 'top') {
    return new DOMRect(
      clamp(centeredLeft, VIEWPORT_MARGIN, maxLeft),
      clamp(rect.top - cardHeight - 16, VIEWPORT_MARGIN, maxTop),
      cardWidth,
      cardHeight,
    );
  }

  if (position === 'left') {
    return new DOMRect(
      clamp(rect.left - cardWidth - 16, VIEWPORT_MARGIN, maxLeft),
      clamp(centeredTop, VIEWPORT_MARGIN, maxTop),
      cardWidth,
      cardHeight,
    );
  }

  if (position === 'right') {
    return new DOMRect(
      clamp(rect.right + 16, VIEWPORT_MARGIN, maxLeft),
      clamp(centeredTop, VIEWPORT_MARGIN, maxTop),
      cardWidth,
      cardHeight,
    );
  }

  return new DOMRect(
    clamp(centeredLeft, VIEWPORT_MARGIN, maxLeft),
    clamp(rect.bottom + 16, VIEWPORT_MARGIN, maxTop),
    cardWidth,
    cardHeight,
  );
}

function rectsOverlap(left: DOMRect, right: DOMRect): boolean {
  return !(
    left.right <= right.left ||
    left.left >= right.right ||
    left.bottom <= right.top ||
    left.top >= right.bottom
  );
}
