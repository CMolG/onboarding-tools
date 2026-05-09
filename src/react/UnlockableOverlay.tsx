import { useEffect, useMemo, useRef } from 'react';
import { useUnlockableContext } from './UnlockableProvider';
import { useUnlockableTutorialEngineMounted } from './tutorialContext';
import type { UnlockStatus, UnlockableDefinition, UnlockableOverlayConfig } from '../core/types';

export interface UnlockableOverlayProps {
  readonly definition: UnlockableDefinition;
  readonly status: UnlockStatus;
}

export function UnlockableOverlay({ definition, status }: UnlockableOverlayProps) {
  const context = useUnlockableContext();
  const tutorialEngineMounted = useUnlockableTutorialEngineMounted();
  const targetRef = useRef<HTMLDivElement>(null);
  const config = useMemo(
    () => mergeOverlayConfig(context.overlay, definition),
    [context.overlay, definition],
  );

  useEffect(() => {
    context.registerOverlayTarget(definition.id, targetRef.current);
    return () => context.registerOverlayTarget(definition.id, null);
  }, [context, definition.id]);

  if (tutorialEngineMounted || config.kind === 'none' || context.isOverlayDismissed(definition.id)) {
    return null;
  }

  const title = config.title ?? definition.meta.title;
  const body = config.body ?? definition.meta.description;
  const actionLabel = config.primaryActionLabel ?? 'Unlock';
  const dismissLabel = config.dismissActionLabel ?? 'Not now';
  const dismissible = config.dismissible ?? true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${definition.id}-unlock-title`}
      aria-describedby={`${definition.id}-unlock-body`}
      data-unlockable-overlay={definition.id}
      data-unlockable-overlay-kind={config.kind ?? 'coach'}
      className="ot-overlay-backdrop"
    >
      <div
        ref={targetRef}
        tabIndex={-1}
        className={[
          'ot-overlay-card',
          config.className,
        ].filter(Boolean).join(' ')}
      >
        <div className="ot-overlay-eyebrow">
          New capability unlocked
        </div>
        <div className="sr-only" aria-live="polite" data-unlockable-live="true">
          {status === 'ELIGIBLE' ? `${title} is ready to unlock.` : `${title} is ${status.toLowerCase()}.`}
        </div>
        <h2 id={`${definition.id}-unlock-title`} className="ot-overlay-title">
          {title}
        </h2>
        <p id={`${definition.id}-unlock-body`} className="ot-overlay-body">
          {body}
        </p>
        <div className="ot-overlay-actions">
          {dismissible ? (
            <button
              type="button"
              onClick={() => context.dismissOverlay(definition.id)}
              className="ot-button ot-button-secondary"
            >
              {dismissLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => context.confirmUnlock(definition.id)}
            className="ot-button ot-button-primary"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function mergeOverlayConfig(defaults: UnlockableOverlayConfig, definition: UnlockableDefinition): UnlockableOverlayConfig {
  const tutorial = definition.tutorial ?? {};
  const nested = isRecord(tutorial.overlay) ? tutorial.overlay : {};
  return {
    ...defaults,
    ...pickOverlayFields(tutorial as Readonly<Record<string, unknown>>),
    ...nested,
  };
}

function pickOverlayFields(source: Readonly<Record<string, unknown>>): UnlockableOverlayConfig {
  const output: Record<string, string | boolean> = {};
  for (const key of ['kind', 'title', 'body', 'primaryActionLabel', 'dismissActionLabel', 'className'] as const) {
    if (typeof source[key] === 'string') {
      output[key] = source[key];
    }
  }
  if (typeof source.dismissible === 'boolean') {
    output.dismissible = source.dismissible;
  }
  return output as UnlockableOverlayConfig;
}

function isRecord(value: unknown): value is UnlockableOverlayConfig {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
