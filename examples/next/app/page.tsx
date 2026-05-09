'use client';

import Link from 'next/link';
import { Unlockable } from 'onboarding-tools/react';

import { definitions } from './unlockables';

export default function HomePage() {
  return (
    <>
      <p>
        This demo wires three unlockables to three patterns. Use the toolbar
        above to fire events and toggle archetypes; watch the navigation,
        animations, and tutorial overlay react.
      </p>
      <Unlockable definition={definitions[0]} placeholder={<HiddenStub label="Profile (hidden)" />}>
        <article className="card" data-tour="profile-card">
          <h2>Profile</h2>
          <p>
            Visible by default — automatic activation with no criteria. Go
            to <Link href="/profile">/profile</Link>.
          </p>
        </article>
      </Unlockable>
      <Unlockable definition={definitions[1]} placeholder={<HiddenStub label="Dashboard (locked)" />}>
        <article className="card" data-tour="dashboard-card">
          <h2>Dashboard</h2>
          <p>
            Visible after the <code>profile.completed</code> event fires
            and you confirm the manual unlock.
          </p>
        </article>
      </Unlockable>
      <Unlockable definition={definitions[2]} placeholder={<HiddenStub label="Advanced (archetype-gated)" />}>
        <article className="card" data-tour="advanced-card">
          <h2>Advanced tools</h2>
          <p>
            Visible only when the user is tagged with the{' '}
            <code>power-user</code> archetype.
          </p>
        </article>
      </Unlockable>
    </>
  );
}

function HiddenStub({ label }: { readonly label: string }) {
  return (
    <article className="card" style={{ opacity: 0.55, borderStyle: 'dashed' }}>
      <span className="tag">hidden</span>
      <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{label}</p>
    </article>
  );
}
