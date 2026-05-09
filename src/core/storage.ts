import { createStorageKey, parseUnlockState, serializeUnlockState, type UnlockState } from './state';
import type { UnlockableDefinition, UnlockableStorageAdapter } from './types';

export function createLocalStorageAdapter(): UnlockableStorageAdapter {
  return {
    getItem(key) {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    },
    setItem(key, value) {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(key, value);
    },
    removeItem(key) {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.removeItem(key);
    },
  };
}

export function loadUnlockState(
  appId: string,
  definitions: readonly UnlockableDefinition[],
  storage: UnlockableStorageAdapter,
  warn: ((message: string, error?: unknown) => void) | undefined = console.warn,
): UnlockState {
  try {
    return parseUnlockState(storage.getItem(createStorageKey(appId)), definitions, { appId, warn });
  } catch (error) {
    warn?.(`Unable to read unlockable state for app "${appId}".`, error);
    return parseUnlockState(null, definitions);
  }
}

export function saveUnlockState(
  appId: string,
  state: UnlockState,
  storage: UnlockableStorageAdapter,
  warn: ((message: string, error?: unknown) => void) | undefined = console.warn,
): void {
  try {
    const key = createStorageKey(appId);
    storage.setItem(key, mergePersistedUnlockedIds(storage.getItem(key), serializeUnlockState(state), state));
  } catch (error) {
    warn?.(`Unable to persist unlockable state for app "${appId}".`, error);
  }
}

function mergePersistedUnlockedIds(existingRaw: string | null, nextRaw: string, state: UnlockState): string {
  if (!existingRaw) {
    return nextRaw;
  }

  try {
    const existing = JSON.parse(existingRaw) as { readonly unlockedIds?: unknown };
    const next = JSON.parse(nextRaw) as { unlockedIds?: string[] };
    if (!Array.isArray(existing.unlockedIds) || !Array.isArray(next.unlockedIds)) {
      return nextRaw;
    }

    const knownIds = new Set(Object.keys(state.statusById));
    const unknownExistingIds = existing.unlockedIds.filter((id): id is string => typeof id === 'string' && !knownIds.has(id));
    next.unlockedIds = Array.from(new Set([...unknownExistingIds, ...next.unlockedIds])).sort();
    return JSON.stringify(next);
  } catch {
    return nextRaw;
  }
}
