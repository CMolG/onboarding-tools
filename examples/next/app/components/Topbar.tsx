'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUnlockableSignals } from 'onboarding-tools/react';

import { DOCS_APP_ID, DOCS_EVENTS_KEY } from '@/app/definitions';
import { ConfirmModal } from './ConfirmModal';
import { CommandPalette } from './CommandPalette';
import { Kbd } from './Kbd';
import { SkipTutorialButton } from './SkipTutorialButton';
import { useToast } from './Toast';
import { CircleIcon, ExternalLinkIcon, MenuIcon, ResetIcon, CheckCircleIcon } from './Icons';

const archetypes = ['none', 'builder', 'storyteller', 'explorer', 'power-user'] as const;

export function Topbar({ onOpenMenu }: { readonly onOpenMenu: () => void }) {
  const pathname = usePathname() ?? '/';
  const [commandOpen, setCommandOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { userArchetypes, setUserArchetypes, flags, setFlag } = useUnlockableSignals();
  const { showToast } = useToast();
  const selectedArchetype = userArchetypes[0] ?? 'none';
  const developerMode = flags['developer-mode'] === true;

  useEffect(() => {
    const storedArchetype = window.localStorage.getItem('docs-archetype');
    if (storedArchetype && storedArchetype !== 'none') {
      setUserArchetypes([storedArchetype]);
    }
    const storedDevMode = window.localStorage.getItem('docs-flag-developer-mode') === 'true';
    if (storedDevMode) {
      setFlag('developer-mode', true);
    }
  }, [setFlag, setUserArchetypes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="md3-topbar sticky top-0 z-50 flex h-[var(--docs-topbar-height)] items-center gap-2 px-3 md:px-4">
      <div className="lg:hidden">
        <button
          type="button"
          className="md3-icon-button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/" className="shrink-0 rounded-full px-2 py-1 text-[15px] font-extrabold tracking-normal text-docs-text transition hover:bg-docs-surface-container-high" aria-current={pathname === '/' ? 'page' : undefined}>
          onboarding-tools
        </Link>
        <span className="hidden sm:inline-flex">
          <span className="md3-chip h-7 min-h-7 px-2 text-[11px]">v0.1.0</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="md3-field ml-auto hidden min-w-[14rem] items-center justify-between gap-3 px-3 text-left text-sm text-docs-text-muted md:inline-flex"
        aria-label="Search documentation"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <span>Search</span>
        <Kbd>⌘K</Kbd>
      </button>
      <label className="md3-field hidden min-h-10 items-center gap-2 px-3 text-sm text-docs-text-muted md:inline-flex">
        <span className="hidden text-xs font-bold uppercase tracking-[0.12em] lg:inline">Archetype</span>
        <select
          value={selectedArchetype}
          onChange={(event) => {
            const next = event.target.value;
            setUserArchetypes(next === 'none' ? [] : [next]);
            window.localStorage.setItem('docs-archetype', next);
          }}
          className="bg-transparent text-sm font-bold text-docs-text outline-none"
          aria-label="Select visitor archetype"
        >
          {archetypes.map((archetype) => (
            <option key={archetype} value={archetype}>
              {archetype}
            </option>
          ))}
        </select>
      </label>
      <div className="hidden sm:block">
        <button
          type="button"
          aria-pressed={developerMode}
          onClick={() => {
            const next = !developerMode;
            setFlag('developer-mode', next);
            window.localStorage.setItem('docs-flag-developer-mode', String(next));
            showToast(next ? 'Developer mode enabled.' : 'Developer mode disabled.');
          }}
          className={developerMode ? 'md3-button-tonal' : 'md3-button-outlined'}
        >
          <span>dev mode</span>
          <span className={developerMode ? 'text-docs-accent' : 'text-docs-text-muted'} aria-hidden="true">
            {developerMode ? <CheckCircleIcon className="size-4" /> : <CircleIcon className="size-4" />}
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setResetOpen(true)}
        className="md3-icon-button"
        aria-label="Reset progress"
      >
        <ResetIcon className="size-5" />
      </button>
      <div className="sm:hidden">
        <SkipTutorialButton compact />
      </div>
      <div className="hidden sm:block">
        <SkipTutorialButton />
      </div>
      <div className="hidden sm:block">
        <a
          href="https://github.com/CMolG/onboarding-tools"
          target="_blank"
          rel="noreferrer"
          className="md3-icon-button"
          aria-label="Open GitHub repository"
        >
          <ExternalLinkIcon className="size-5" />
        </a>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <ConfirmModal
        open={resetOpen}
        title="Reset progress?"
        confirmLabel="Reset progress"
        destructive
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          window.localStorage.removeItem(`unlockable:state:${DOCS_APP_ID}`);
          window.localStorage.removeItem(DOCS_EVENTS_KEY);
          window.localStorage.removeItem('docs-archetype');
          window.localStorage.removeItem('docs-flag-developer-mode');
          showToast('Progress reset.');
          window.location.assign('/');
        }}
      >
        <p>This clears the docs storage partition, archetype selection, and developer-mode flag.</p>
        <p>The page will reload into the fresh onboarding state.</p>
      </ConfirmModal>
    </header>
  );
}
