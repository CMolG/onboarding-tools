import { describe, expect, it, vi } from 'vitest';
import { isUnlockEligible } from '../../src/core/criteria';
import type { UnlockContext, UnlockableDefinition } from '../../src/core/types';

const baseDefinition: UnlockableDefinition = {
  id: 'sidebar.aiWorkbench',
  meta: {
    title: 'AI Workbench',
    description: 'Operational workspace for assisted job hunting.',
  },
};

function definitionWith(unlocksOn: UnlockableDefinition['unlocksOn']): UnlockableDefinition {
  return {
    ...baseDefinition,
    unlocksOn,
  };
}

describe('unlock criteria evaluator', () => {
  it('treats an omitted unlocksOn as eligible', () => {
    expect(isUnlockEligible(baseDefinition, {})).toBe(true);
  });

  it('fails closed for a runtime null unlocksOn', () => {
    const definition = {
      ...baseDefinition,
      unlocksOn: null,
    } as unknown as UnlockableDefinition;

    expect(isUnlockEligible(definition, {})).toBe(false);
  });

  it('requires every child criterion for all', () => {
    const definition = definitionWith({
      all: [
        { kind: 'event', event: 'navigation.activated' },
        { kind: 'archetype', value: 'operator' },
      ],
    });

    expect(isUnlockEligible(definition, { events: ['navigation.activated'], userArchetypes: ['operator'] })).toBe(true);
    expect(isUnlockEligible(definition, { events: ['navigation.activated'], userArchetypes: ['analyst'] })).toBe(false);
  });

  it('documents empty logical group semantics', () => {
    expect(isUnlockEligible(definitionWith({ all: [] }), {})).toBe(true);
    expect(isUnlockEligible(definitionWith({ any: [] }), {})).toBe(false);
  });

  it('accepts one matching child criterion for any', () => {
    const definition = definitionWith({
      any: [
        { kind: 'event', event: 'profile.completed' },
        { kind: 'flag', key: 'betaUnlocks' },
      ],
    });

    expect(isUnlockEligible(definition, { flags: { betaUnlocks: true } })).toBe(true);
    expect(isUnlockEligible(definition, { events: ['job.saved'] })).toBe(false);
  });

  it('negates a criterion with not', () => {
    const definition = definitionWith({
      not: { kind: 'flag', key: 'hideAdvancedTools' },
    });

    expect(isUnlockEligible(definition, { flags: { hideAdvancedTools: false } })).toBe(true);
    expect(isUnlockEligible(definition, { flags: { hideAdvancedTools: true } })).toBe(false);
  });

  it('evaluates nested all, any, and not criteria together', () => {
    const definition = definitionWith({
      all: [
        { kind: 'event', event: 'profile.completed' },
        {
          any: [{ kind: 'archetype', value: 'operator' }, { not: { kind: 'flag', key: 'hasLegacyBlocker' } }],
        },
        { not: { kind: 'state', key: 'mode', equals: 'blocked' } },
      ],
    });

    expect(
      isUnlockEligible(definition, {
        events: ['profile.completed'],
        userArchetypes: ['explorer'],
        flags: { hasLegacyBlocker: false },
        state: { mode: 'active' },
      }),
    ).toBe(true);
    expect(
      isUnlockEligible(definition, {
        events: ['profile.completed'],
        userArchetypes: ['explorer'],
        flags: { hasLegacyBlocker: true },
        state: { mode: 'active' },
      }),
    ).toBe(false);
    expect(
      isUnlockEligible(definition, {
        events: ['profile.completed'],
        userArchetypes: ['operator'],
        flags: { hasLegacyBlocker: true },
        state: { mode: 'blocked' },
      }),
    ).toBe(false);
  });

  it('matches event criteria from context events', () => {
    const definition = definitionWith({ kind: 'event', event: 'profile.completed' });

    expect(isUnlockEligible(definition, { events: ['profile.completed'] })).toBe(true);
    expect(isUnlockEligible(definition, { events: ['navigation.activated'] })).toBe(false);
  });

  it('matches archetype criteria from context user archetypes', () => {
    const definition = definitionWith({ kind: 'archetype', value: 'operator' });

    expect(isUnlockEligible(definition, { userArchetypes: ['operator'] })).toBe(true);
    expect(isUnlockEligible(definition, { userArchetypes: ['explorer'] })).toBe(false);
  });

  it('matches flag criteria from context flags', () => {
    const presenceDefinition = definitionWith({ kind: 'flag', key: 'betaUnlocks' });
    const valueDefinition = definitionWith({ kind: 'flag', key: 'mode', value: 'advanced' });

    expect(isUnlockEligible(presenceDefinition, { flags: { betaUnlocks: true } })).toBe(true);
    expect(isUnlockEligible(presenceDefinition, { flags: { betaUnlocks: false } })).toBe(false);
    expect(isUnlockEligible(valueDefinition, { flags: { mode: 'advanced' } })).toBe(true);
    expect(isUnlockEligible(valueDefinition, { flags: { mode: 'basic' } })).toBe(false);
  });

  it('matches state criteria from context state', () => {
    const definition = definitionWith({
      kind: 'state',
      key: 'profile',
      equals: { completed: true, sections: ['experience', 'skills'] },
    });

    expect(
      isUnlockEligible(definition, {
        state: { profile: { completed: true, sections: ['experience', 'skills'] } },
      }),
    ).toBe(true);
    expect(
      isUnlockEligible(definition, {
        state: { profile: { completed: true, sections: ['skills'] } },
      }),
    ).toBe(false);
  });

  it('matches unlockable criteria from prior status by id', () => {
    const definition = definitionWith({ kind: 'unlockable', id: 'sidebar.dashboard' });

    expect(isUnlockEligible(definition, { statusById: { 'sidebar.dashboard': 'UNLOCKED' } })).toBe(true);
    expect(isUnlockEligible(definition, { statusById: { 'sidebar.dashboard': 'ELIGIBLE' } })).toBe(false);
  });

  it('fails closed for invalid unlockable criterion status values', () => {
    const definition = {
      ...baseDefinition,
      unlocksOn: { kind: 'unlockable', id: 'sidebar.dashboard', status: 'archived' },
    } as unknown as UnlockableDefinition;
    const context = {
      statusById: { 'sidebar.dashboard': null },
    } as unknown as UnlockContext;

    expect(isUnlockEligible(definition, context)).toBe(false);
  });

  it('matches resolver criteria from context decisions', () => {
    const definition = definitionWith({ kind: 'resolver', resolverId: 'local' });

    expect(
      isUnlockEligible(definition, {
        decisions: [
          {
            unlockableId: baseDefinition.id,
            unlock: true,
            resolverId: 'local',
            reason: 'User matched operator signals.',
            matchedSignals: ['operator'],
          },
        ],
      }),
    ).toBe(true);
    expect(
      isUnlockEligible(definition, {
        decisions: [
          {
            unlockableId: baseDefinition.id,
            unlock: false,
            resolverId: 'local',
            reason: 'Missing signals.',
            matchedSignals: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it('fails closed for resolver criteria with mismatched unlockable ids', () => {
    const definition = definitionWith({ kind: 'resolver', resolverId: 'local' });

    expect(
      isUnlockEligible(definition, {
        decisions: [
          {
            unlockableId: 'sidebar.dashboard',
            unlock: true,
            resolverId: 'local',
            reason: 'Other unlockable matched.',
            matchedSignals: ['operator'],
          },
        ],
      }),
    ).toBe(false);
  });

  it('fails closed for unknown criterion kinds', () => {
    const definition = {
      ...baseDefinition,
      unlocksOn: { kind: 'unknown' },
    } as unknown as UnlockableDefinition;

    expect(isUnlockEligible(definition, {})).toBe(false);
  });

  it('can warn for unknown criterion kinds while failing closed', () => {
    const warn = vi.fn();
    const definition = {
      ...baseDefinition,
      unlocksOn: { kind: 'unknown' },
    } as unknown as UnlockableDefinition;

    expect(isUnlockEligible(definition, {}, { warn })).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown unlock criterion kind "unknown"'),
      expect.objectContaining({ kind: 'unknown' }),
    );
  });
});
