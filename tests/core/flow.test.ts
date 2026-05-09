import { describe, expect, it } from 'vitest';
import { deriveUnlockableFlow } from '../../src/core/flow';
import type { UnlockableDefinition } from '../../src/core/types';

function definition(id: string, extra: Partial<UnlockableDefinition> = {}): UnlockableDefinition {
  return {
    id,
    meta: { title: id, description: id },
    ...extra,
  };
}

describe('deriveUnlockableFlow', () => {
  it('orders stages from completion-event criteria before flow.order tie-breaks', () => {
    const result = deriveUnlockableFlow([
      definition('sidebar.myCvs', {
        unlocksOn: { kind: 'event', event: 'cv.upload.completed' },
        flow: { stage: 'My CVs', completionEvent: 'profile.cv.reviewed', order: 1 },
      }),
      definition('onboarding.cvUpload', {
        unlocksOn: { kind: 'event', event: 'cognitive.profile.completed' },
        flow: { stage: 'CV upload', completionEvent: 'cv.upload.completed', order: 99 },
      }),
      definition('onboarding.cognitiveProfile', {
        flow: { stage: 'Cognitive profile', completionEvent: 'cognitive.profile.completed', order: 99 },
      }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.stages.map((stage) => stage.id)).toEqual([
      'onboarding.cognitiveProfile',
      'onboarding.cvUpload',
      'sidebar.myCvs',
    ]);
  });

  it('uses order and id as deterministic tie-breakers for independent stages', () => {
    const result = deriveUnlockableFlow([
      definition('z', { flow: { order: 2 } }),
      definition('b', { flow: {} }),
      definition('a', { flow: {} }),
      definition('m', { flow: { order: 1 } }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.stages.map((stage) => stage.id)).toEqual(['m', 'z', 'a', 'b']);
  });

  it('rejects duplicate completion events', () => {
    const result = deriveUnlockableFlow([
      definition('a', { flow: { completionEvent: 'same.event' } }),
      definition('b', { flow: { completionEvent: 'same.event' } }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('Duplicate completion event');
  });

  it('marks unknown event criteria as blocked errors', () => {
    const result = deriveUnlockableFlow([
      definition('a', {
        unlocksOn: { kind: 'event', event: 'missing.event' },
        flow: { stage: 'A' },
      }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('Unknown completion event');
  });

  it('extracts nested event criteria', () => {
    const result = deriveUnlockableFlow([
      definition('first', { flow: { completionEvent: 'first.done' } }),
      definition('second', {
        unlocksOn: {
          all: [
            { any: [{ kind: 'event', event: 'first.done' }] },
            { not: { kind: 'flag', key: 'disabled' } },
          ],
        },
        flow: { completionEvent: 'second.done' },
      }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.stages.map((stage) => stage.id)).toEqual(['first', 'second']);
    expect(result.stages[1].dependsOn).toEqual(['first']);
  });

  it('rejects dependency cycles', () => {
    const result = deriveUnlockableFlow([
      definition('a', {
        unlocksOn: { kind: 'event', event: 'b.done' },
        flow: { completionEvent: 'a.done' },
      }),
      definition('b', {
        unlocksOn: { kind: 'event', event: 'a.done' },
        flow: { completionEvent: 'b.done' },
      }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('cycle');
  });
});
