'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useUnlockableEvents, useUnlockableSignals } from 'onboarding-tools/react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'Profile' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/advanced', label: 'Advanced' },
] as const;

export function Shell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  return (
    <main className="app">
      <header>
        <h1>onboarding-tools · Next.js demo</h1>
        <nav>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <DevToolbar />
      {children}
    </main>
  );
}

function DevToolbar() {
  const { events, emitEvent } = useUnlockableEvents();
  const { userArchetypes, setUserArchetypes } = useUnlockableSignals();
  const isPowerUser = userArchetypes.includes('power-user');

  return (
    <div className="toolbar">
      <strong>Demo controls:</strong>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => emitEvent('profile.completed')}
      >
        Emit profile.completed
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setUserArchetypes(isPowerUser ? [] : ['power-user'])}
      >
        {isPowerUser ? 'Clear archetype' : 'Become power-user'}
      </button>
      <span className="tag">events: {events.join(', ') || '∅'}</span>
      <span className="tag">archetypes: {userArchetypes.join(', ') || '∅'}</span>
    </div>
  );
}
