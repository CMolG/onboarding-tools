'use client';

import { useEffect, useState } from 'react';
import { useUnlockableEvents, useUnlockableSignals } from 'onboarding-tools/react';

const cards = [
  {
    archetype: 'builder',
    title: 'Builder workspace',
    body: 'Implementation-first copy, provider tree snippets, and test fixtures rise to the top.',
  },
  {
    archetype: 'storyteller',
    title: 'Storyteller workspace',
    body: 'Narrative examples, reveal pacing, and user-facing language become the primary path.',
  },
] as const;

export function ArchetypeShowcase() {
  const { userArchetypes } = useUnlockableSignals();
  const { events, emitEvent } = useUnlockableEvents();
  const [tried, setTried] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const current = userArchetypes[0];
    if (!current || current === 'none') {
      return;
    }
    setTried((previous) => {
      const next = new Set([...previous, current]);
      if (next.size >= 2 && !events.includes('archetype.experimented')) {
        emitEvent('archetype.experimented');
      }
      return next;
    });
  }, [emitEvent, events, userArchetypes]);

  return (
    <section id="topbar-signal" data-tour="archetype-showcase" className="md3-card-elevated p-4 sm:p-5">
      <h2 className="m-0 text-lg font-extrabold text-docs-text">Topbar signal</h2>
      <p className="mt-1 text-sm text-docs-text-muted">Use the archetype dropdown in the topbar. Try two values to complete this section.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const active = userArchetypes.includes(card.archetype);
          return (
            <article
              key={card.archetype}
              id={card.archetype}
              className={active
                ? 'rounded-docs-lg border border-docs-accent-ring bg-docs-accent-soft p-4 text-docs-on-accent-soft shadow-docs-sm'
                : 'rounded-docs-lg border border-dashed border-docs-border bg-docs-surface-container-low p-4 text-docs-text-muted'}
            >
              <span className="md3-chip bg-docs-surface">{card.archetype}</span>
              <h3 className="mt-3 text-base font-extrabold">{card.title}</h3>
              <p className="mt-2 text-sm">{active ? card.body : 'Waiting for this archetype.'}</p>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-docs-text-muted">Tried: {Array.from(tried).join(', ') || 'none'} · {Math.min(tried.size, 2)} / 2</p>
    </section>
  );
}
