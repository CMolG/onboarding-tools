import type { SerializableRecord, UnlockEffect } from './types';

export interface MotionPreferenceOptions {
  readonly reducedMotion?: boolean;
}

export interface RunUnlockEffectOptions extends MotionPreferenceOptions {
  readonly element?: HTMLElement | null;
  readonly defaultEffect?: UnlockEffect;
  readonly timeoutMs?: number;
  readonly reducedMotionDurationMs?: number;
}

export function resolveMotionPreference(options: MotionPreferenceOptions = {}): 'reduce' | 'no-preference' {
  if (typeof options.reducedMotion === 'boolean') {
    return options.reducedMotion ? 'reduce' : 'no-preference';
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference';
    } catch {
      return 'no-preference';
    }
  }

  return 'no-preference';
}

export function runUnlockEffect(effect: UnlockEffect | undefined, options: RunUnlockEffectOptions = {}): Promise<void> {
  const preference = resolveMotionPreference(options);
  const element = options.element ?? null;
  const config = normalizeEffect(effect ?? options.defaultEffect);
  const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? config.durationMs + 100;

  if (preference === 'reduce' || element === null) {
    const durationMs = options.reducedMotionDurationMs ?? 0;
    return new Promise((resolve) => globalThis.setTimeout(resolve, durationMs));
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      globalThis.clearTimeout(timer);
      element.removeEventListener('animationend', finish);
      element.removeEventListener('transitionend', finish);
      if (config.className) {
        element.classList.remove(config.className);
      }
      resolve();
    };

    const timer = globalThis.setTimeout(finish, Math.max(0, timeoutMs));
    element.addEventListener('animationend', finish, { once: true });
    element.addEventListener('transitionend', finish, { once: true });

    if (config.className) {
      element.classList.add(config.className);
      void element.offsetWidth;
    }
  });
}

function normalizeEffect(effect: UnlockEffect | undefined): { className: string; durationMs: number; timeoutMs?: number } {
  if (typeof effect === 'string') {
    return { className: `unlockable-effect-${effect}`, durationMs: 300 };
  }

  if (isRecord(effect)) {
    const name = typeof effect.name === 'string' ? effect.name : 'reveal';
    const className = typeof effect.className === 'string' ? effect.className : `unlockable-effect-${name}`;
    return {
      className,
      durationMs: typeof effect.durationMs === 'number' ? effect.durationMs : 300,
      timeoutMs: typeof effect.timeoutMs === 'number' ? effect.timeoutMs : undefined,
    };
  }

  return { className: 'unlockable-effect-reveal', durationMs: 300 };
}

function isRecord(value: unknown): value is SerializableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
