'use client';

import { useMemo, useState } from 'react';
import type { UnlockableDefinition } from 'onboarding-tools';
import { useUnlockableEvents } from 'onboarding-tools/react';

import { DocsPage } from '@/app/components/DocsPage';
import { Playground } from '@/app/playground/Playground';
import { SandboxedUnlockable } from '@/app/playground/preview/SandboxedUnlockable';
import { definitionSnippet } from '@/app/lib/codegen';

export default function QuickstartPage() {
  const [runs, setRuns] = useState(0);
  const { events, emitEvent } = useUnlockableEvents();
  const definition = useMemo<UnlockableDefinition>(() => ({
    id: 'quickstart-demo',
    activation: 'automatic',
    visibility: 'placeholder',
    meta: {
      title: 'Dashboard',
      description: 'Visible after profile is complete.',
    },
    unlocksOn: { kind: 'event', event: 'profile.completed' },
  }), []);

  return (
    <DocsPage sectionId="quickstart">
      <section id="provider-tree" className="md3-card-tonal mb-5 p-5 text-sm leading-6">
        <p className="m-0 font-semibold text-docs-on-accent-soft">
          Import <code>onboarding-tools/styles.css</code>, mount <code>UnlockableProvider</code>, register definitions once, then wrap host UI with <code>{'<Unlockable>'}</code>.
        </p>
      </section>
      <div id="run" data-tour="quickstart-playground">
        <Playground
          title="Minimal provider + one definition"
          controls={(
            <button
              type="button"
              className="md3-button w-full"
              onClick={() => {
                setRuns((current) => current + 1);
                if (!events.includes('quickstart.run')) {
                  emitEvent('quickstart.run');
                }
              }}
            >
              Run
            </button>
          )}
          preview={(
            <SandboxedUnlockable
              appId="quickstart"
              resetKey={runs}
              definition={definition}
              initialEvents={runs > 0 ? ['profile.completed'] : []}
            />
          )}
          code={definitionSnippet({
            id: 'dashboard',
            title: 'Dashboard',
            criterion: { kind: 'event', event: 'profile.completed' },
            event: 'quickstart.run',
          })}
        />
      </div>
    </DocsPage>
  );
}
