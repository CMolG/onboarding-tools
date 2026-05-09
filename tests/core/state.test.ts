import { describe, expect, it } from 'vitest';
import {
  createStorageKey,
  createUnlockState,
  markUnlocked,
  parseUnlockState,
  serializeUnlockState,
  skipUnlocks,
  transitionUnlockStatus,
  type UnlockState,
} from '../../src/core/state';
import type { UnlockableDefinition } from '../../src/core/types';

function definition(id: string, unlocksOn?: UnlockableDefinition['unlocksOn']): UnlockableDefinition {
  return {
    id,
    meta: {
      title: id,
      description: `${id} description`,
    },
    ...(unlocksOn === undefined ? {} : { unlocksOn }),
  };
}

const definitions = [
  definition('dashboard'),
  definition('profile', { kind: 'event', event: 'profile.completed' }),
  definition('advanced', { kind: 'flag', key: 'advancedUnlocks' }),
] as const;

describe('unlock state machine', () => {
  it('starts all definitions as HIDDEN unless eligible', () => {
    const state = createUnlockState(definitions, { events: ['profile.completed'] });

    expect(state).toEqual({
      skipped: false,
      statusById: {
        dashboard: 'ELIGIBLE',
        profile: 'ELIGIBLE',
        advanced: 'HIDDEN',
      },
    });
  });

  it('keeps already unlocked state monotonic even when criteria are not currently met', () => {
    const state = createUnlockState(definitions, {
      statusById: {
        advanced: 'UNLOCKED',
      },
    });

    expect(state.statusById.advanced).toBe('UNLOCKED');
  });

  it('moves ELIGIBLE to UNLOCKING to UNLOCKED', () => {
    const eligible = createUnlockState([definitions[0]], {});
    const unlocking = transitionUnlockStatus(eligible, 'dashboard', 'UNLOCKING');
    const unlocked = markUnlocked(unlocking, 'dashboard');

    expect(unlocking.statusById.dashboard).toBe('UNLOCKING');
    expect(unlocked.statusById.dashboard).toBe('UNLOCKED');
  });

  it('fails closed for illegal transitions', () => {
    const state = createUnlockState(definitions, {});
    const hiddenToUnlocked = transitionUnlockStatus(state, 'advanced', 'UNLOCKED');
    const eligibleToHidden = transitionUnlockStatus(state, 'dashboard', 'HIDDEN');
    const unknownId = transitionUnlockStatus(state, 'missing', 'UNLOCKING');

    expect(hiddenToUnlocked.statusById.advanced).toBe('HIDDEN');
    expect(eligibleToHidden.statusById.dashboard).toBe('ELIGIBLE');
    expect(unknownId).toBe(state);
  });

  it('hydrates persisted unlocked status without replaying UNLOCKING', () => {
    const liveState: UnlockState = {
      skipped: false,
      statusById: {
        dashboard: 'UNLOCKED',
        profile: 'UNLOCKING',
        advanced: 'HIDDEN',
      },
    };

    const hydrated = parseUnlockState(serializeUnlockState(liveState), definitions);

    expect(hydrated).toEqual({
      skipped: false,
      statusById: {
        dashboard: 'UNLOCKED',
        profile: 'HIDDEN',
        advanced: 'HIDDEN',
      },
    });
    expect(Object.values(hydrated.statusById)).not.toContain('UNLOCKING');
  });

  it('resets cleanly for malformed storage', () => {
    expect(parseUnlockState('{malformed', definitions)).toEqual({
      skipped: false,
      statusById: {
        dashboard: 'HIDDEN',
        profile: 'HIDDEN',
        advanced: 'HIDDEN',
      },
    });

    expect(parseUnlockState(JSON.stringify({ version: 1, skipped: false, unlockedIds: [1] }), definitions)).toEqual({
      skipped: false,
      statusById: {
        dashboard: 'HIDDEN',
        profile: 'HIDDEN',
        advanced: 'HIDDEN',
      },
    });
  });

  it('persists skipped all-unlocked state', () => {
    const initial = createUnlockState(definitions, {});
    const skipped = skipUnlocks(initial, definitions);
    const hydrated = parseUnlockState(serializeUnlockState(skipped), definitions);

    expect(skipped.skipped).toBe(true);
    expect(Object.values(skipped.statusById)).toEqual(['UNLOCKED', 'UNLOCKED', 'UNLOCKED']);
    expect(hydrated).toEqual(skipped);
  });

  it('hydrates partial skipped state from persisted unlocked ids only', () => {
    const initial = createUnlockState(definitions, {});
    const skipped = skipUnlocks(initial, [definitions[0], definitions[2]]);
    const hydrated = parseUnlockState(serializeUnlockState(skipped), definitions);

    expect(hydrated).toEqual({
      skipped: true,
      statusById: {
        dashboard: 'UNLOCKED',
        profile: 'HIDDEN',
        advanced: 'UNLOCKED',
      },
    });
  });

  it('creates a namespaced storage key', () => {
    expect(createStorageKey('job-hunter')).toBe('unlockable:state:job-hunter');
  });
});
