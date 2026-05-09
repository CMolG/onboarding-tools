import { describe, expect, it } from 'vitest';
import { EMPTY_UNLOCK_RESOLVER, createLocalUnlockableResolver } from '../../src/core/resolver';
import type { UnlockableDefinition } from '../../src/core/types';

function definition(
  id: string,
  overrides: Partial<Pick<UnlockableDefinition, 'archetype' | 'autoAssignable' | 'meta'>> = {},
): UnlockableDefinition {
  return {
    id,
    autoAssignable: true,
    meta: {
      title: id,
      description: `${id} description`,
    },
    ...overrides,
  };
}

describe('local unlockable resolver', () => {
  it('only considers autoAssignable definitions', () => {
    const resolver = createLocalUnlockableResolver();
    const decisions = resolver(
      [
        definition('manual-match', { autoAssignable: false, archetype: 'operator' }),
        definition('default-manual-match', { autoAssignable: undefined, archetype: 'operator' }),
        definition('auto-no-match', { archetype: 'analyst' }),
      ],
      { userArchetypes: ['operator'] },
    );

    expect(decisions).toEqual([
      expect.objectContaining({
        unlockableId: 'auto-no-match',
        unlock: false,
        matchedSignals: [],
      }),
    ]);
  });

  it('matches explicit archetypes against user archetypes', () => {
    const resolver = createLocalUnlockableResolver();
    const decisions = resolver(
      [
        definition('single-archetype', { archetype: ' Operator ' }),
        definition('many-archetypes', { archetype: ['builder', 'analyst'] }),
      ],
      { userArchetypes: ['operator', ' ANALYST '] },
    );

    expect(decisions).toEqual([
      expect.objectContaining({
        unlockableId: 'single-archetype',
        unlock: true,
        matchedSignals: ['operator'],
      }),
      expect.objectContaining({
        unlockableId: 'many-archetypes',
        unlock: true,
        matchedSignals: ['analyst'],
      }),
    ]);
  });

  it('matches metadata tags, capability, and audience against user signals', () => {
    const resolver = createLocalUnlockableResolver();
    const decisions = resolver(
      [
        definition('tag-match', {
          meta: {
            title: 'Tag match',
            description: 'Matches a tag.',
            tags: ['Automation', 'batch'],
          },
        }),
        definition('capability-match', {
          meta: {
            title: 'Capability match',
            description: 'Matches a capability.',
            capability: 'AI Assistant',
          },
        }),
        definition('audience-match', {
          meta: {
            title: 'Audience match',
            description: 'Matches an audience.',
            audience: ['Power User'],
          },
        }),
      ],
      { signals: [' automation ', 'ai assistant', 'POWER USER'] },
    );

    expect(decisions).toEqual([
      expect.objectContaining({
        unlockableId: 'tag-match',
        unlock: true,
        matchedSignals: ['automation'],
      }),
      expect.objectContaining({
        unlockableId: 'capability-match',
        unlock: true,
        matchedSignals: ['ai assistant'],
      }),
      expect.objectContaining({
        unlockableId: 'audience-match',
        unlock: true,
        matchedSignals: ['power user'],
      }),
    ]);
  });

  it('returns auditable decisions with resolverId, reason, and matchedSignals', async () => {
    const resolver = createLocalUnlockableResolver({ resolverId: 'local-test' });
    const [decision] = await resolver(
      [
        definition('auditable', {
          archetype: 'operator',
          meta: {
            title: 'Auditable',
            description: 'Matches multiple sources.',
            tags: ['automation'],
          },
        }),
      ],
      { userArchetypes: ['operator'], signals: ['automation'] },
    );

    expect(decision).toEqual({
      unlockableId: 'auditable',
      unlock: true,
      resolverId: 'local-test',
      reason: 'Matched archetype(s) operator and metadata signal(s) automation.',
      matchedSignals: ['operator', 'automation'],
    });
  });

  it('returns unlock false for autoAssignable non-matches', () => {
    const resolver = createLocalUnlockableResolver();
    const decisions = resolver(
      [
        definition('no-match', {
          archetype: ['operator'],
          meta: {
            title: 'No match',
            description: 'No local signals match.',
            tags: ['automation'],
            capability: 'assistant',
            audience: ['power-user'],
          },
        }),
      ],
      { userArchetypes: ['analyst'], signals: ['manual'] },
    );

    expect(decisions).toEqual([
      {
        unlockableId: 'no-match',
        unlock: false,
        resolverId: 'local',
        reason: 'No auto-assignable archetype or metadata signals matched.',
        matchedSignals: [],
      },
    ]);
  });

  it('provides an empty resolver for callers that opt out', () => {
    expect(EMPTY_UNLOCK_RESOLVER([definition('ignored')], { userArchetypes: ['operator'], signals: ['automation'] })).toEqual(
      [],
    );
  });
});
