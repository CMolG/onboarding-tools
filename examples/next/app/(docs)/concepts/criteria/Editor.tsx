'use client';

import { useMemo, useState } from 'react';
import type { UnlockCriterion, UnlockableDefinition } from 'onboarding-tools';
import { useUnlockableEvents } from 'onboarding-tools/react';

import { Playground } from '@/app/playground/Playground';
import { SandboxedUnlockable } from '@/app/playground/preview/SandboxedUnlockable';
import { ChipField } from '@/app/playground/controls/ChipField';
import { EnumField } from '@/app/playground/controls/EnumField';
import { definitionSnippet } from '@/app/lib/codegen';

type CriterionKind = 'event' | 'archetype' | 'flag';
type Combiner = 'single' | 'all' | 'any' | 'not';

export function CriteriaEditor() {
  const [kind, setKind] = useState<CriterionKind>('event');
  const [combiner, setCombiner] = useState<Combiner>('single');
  const [tested, setTested] = useState<ReadonlySet<string>>(() => new Set());
  const { events, emitEvent } = useUnlockableEvents();

  const criterion = useMemo<UnlockCriterion>(() => {
    const base: UnlockCriterion =
      kind === 'event'
        ? { kind: 'event', event: 'profile.completed' }
        : kind === 'archetype'
          ? { kind: 'archetype', value: 'builder' }
          : { kind: 'flag', key: 'beta.enabled', value: true };

    if (combiner === 'all') {
      return { all: [base, { kind: 'event', event: 'profile.completed' }] };
    }
    if (combiner === 'any') {
      return { any: [base, { kind: 'flag', key: 'beta.enabled', value: true }] };
    }
    if (combiner === 'not') {
      return { not: base };
    }
    return base;
  }, [combiner, kind]);

  const definition = useMemo<UnlockableDefinition>(() => ({
    id: 'criteria-demo',
    activation: 'automatic',
    visibility: 'placeholder',
    meta: {
      title: 'Criteria demo',
      description: 'A sandboxed unlockable controlled by the editor.',
    },
    unlocksOn: criterion,
  }), [criterion]);

  const code = definitionSnippet({
    id: 'criteriaDemo',
    title: 'Criteria demo',
    criterion,
    event: 'criteria.experimented',
  });

  const markTested = (value: string) => {
    setTested((current) => {
      const next = new Set([...current, value]);
      if (next.size >= 3 && !events.includes('criteria.experimented')) {
        emitEvent('criteria.experimented');
      }
      return next;
    });
  };

  return (
    <div id="criterion-editor" data-tour="criteria-editor">
      <Playground
        title="Criteria DSL"
        controls={(
          <div className="space-y-4">
            <ChipField label="criterion" value={kind} options={['event', 'archetype', 'flag']} onChange={(value) => {
              setKind(value as CriterionKind);
              markTested(value);
            }} />
            <EnumField label="combiner" value={combiner} options={['single', 'all', 'any', 'not']} onChange={(value) => {
              setCombiner(value as Combiner);
              markTested(value);
            }} />
            <p className="rounded-docs-lg bg-docs-surface p-3 text-xs font-bold text-docs-text-muted shadow-docs-sm">
              Criteria tested: {Math.min(tested.size, 3)} / 3
            </p>
          </div>
        )}
        preview={<SandboxedUnlockable appId="criteria" resetKey={tested.size} definition={definition} />}
        code={code}
      />
    </div>
  );
}
