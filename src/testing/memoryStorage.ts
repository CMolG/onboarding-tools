import type { UnlockableStorageAdapter } from '../core/types';

export interface MemoryUnlockableStorage extends UnlockableStorageAdapter {
  readonly data: Record<string, string>;
}

export function createMemoryStorage(initial: Record<string, string> = {}): MemoryUnlockableStorage {
  return {
    data: { ...initial },
    getItem(key) {
      return this.data[key] ?? null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
  };
}
