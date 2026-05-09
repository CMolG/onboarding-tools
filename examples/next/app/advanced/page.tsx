'use client';

import { useUnlockable, useUnlockableSignals } from 'onboarding-tools/react';

export default function AdvancedPage() {
  const { status } = useUnlockable('advanced');
  const { userArchetypes, setUserArchetypes } = useUnlockableSignals();

  if (status !== 'UNLOCKED') {
    return (
      <article className="card" style={{ borderStyle: 'dashed' }}>
        <span className="tag">{status}</span>
        <p style={{ marginTop: '0.5rem' }}>
          Advanced tools are archetype-gated. Tag the user as{' '}
          <code>power-user</code> to unlock.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => setUserArchetypes(['power-user'])}
        >
          Become power-user
        </button>
        <p style={{ marginTop: '0.75rem' }}>
          <span className="tag">archetypes: {userArchetypes.join(', ') || '∅'}</span>
        </p>
      </article>
    );
  }

  return (
    <article className="card" data-tour="advanced-card">
      <h2>Advanced tools</h2>
      <p>
        🛠 You unlocked this route by matching the <code>power-user</code>{' '}
        archetype. In a real product this is where AI clustering output
        would land — your resolver returns one or more archetypes after a
        personality test.
      </p>
    </article>
  );
}
