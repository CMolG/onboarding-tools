'use client';

import { useUnlockable } from 'onboarding-tools/react';

export default function DashboardPage() {
  const { status } = useUnlockable('dashboard');

  if (status !== 'UNLOCKED') {
    return (
      <article className="card" style={{ borderStyle: 'dashed' }}>
        <span className="tag">{status}</span>
        <p style={{ marginTop: '0.5rem' }}>
          The dashboard is not unlocked yet. Complete your profile from the
          home or <code>/profile</code> page first.
        </p>
      </article>
    );
  }

  return (
    <article className="card" data-tour="dashboard-card">
      <h2>Dashboard</h2>
      <p>
        🎉 You are in. This route is gated by an event and a manual
        confirmation. The status survives reloads thanks to the default{' '}
        <code>localStorage</code> adapter.
      </p>
    </article>
  );
}
