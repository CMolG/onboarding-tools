'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { useUnlockableContext } from 'onboarding-tools/react';

import { getSectionByRoute } from './lib/nav';
import { SideRail } from './components/SideRail';
import { ToastProvider } from './components/Toast';
import { TocRail } from './components/TocRail';
import { Topbar } from './components/Topbar';

export function DocsShell({ children }: { readonly children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? '/';
  const section = getSectionByRoute(pathname) ?? getSectionByRoute('/');

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    let userScrollIntent = false;
    const markUserScrollIntent = () => {
      userScrollIntent = true;
    };
    const markKeyboardScrollIntent = (event: KeyboardEvent) => {
      if ([' ', 'ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp'].includes(event.key)) {
        markUserScrollIntent();
      }
    };
    const delayedResetScroll = () => {
      if (!userScrollIntent) {
        resetScroll();
      }
    };

    resetScroll();
    window.addEventListener('wheel', markUserScrollIntent, { passive: true, once: true });
    window.addEventListener('touchmove', markUserScrollIntent, { passive: true, once: true });
    window.addEventListener('keydown', markKeyboardScrollIntent, { once: true });
    const frame = window.requestAnimationFrame(delayedResetScroll);
    const timeout = window.setTimeout(delayedResetScroll, 750);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener('wheel', markUserScrollIntent);
      window.removeEventListener('touchmove', markUserScrollIntent);
      window.removeEventListener('keydown', markKeyboardScrollIntent);
    };
  }, [pathname]);

  return (
    <ToastProvider>
      <AutoCompleteTerminalSections />
      <div className="min-h-screen bg-transparent">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-docs-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <div className="mx-auto grid min-h-[calc(100vh-var(--docs-topbar-height))] grid-cols-1 lg:grid-cols-[var(--docs-rail-width)_minmax(0,1fr)]">
          <SideRail open={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,820px)_var(--docs-toc-width)] xl:justify-center">
            <main id="main-content" className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
              {children}
            </main>
            {section ? <TocRail sectionId={section.id} /> : null}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

function AutoCompleteTerminalSections() {
  const { definitions, statusById, completeUnlock } = useUnlockableContext();

  useEffect(() => {
    const timeouts = definitions
      .filter((definition) => {
        const status = statusById[definition.id];
        return (
          status === 'UNLOCKING' &&
          (definition.activation ?? 'automatic') === 'automatic' &&
          !definition.flow?.completionEvent
        );
      })
      .map((definition, index) => window.setTimeout(() => completeUnlock(definition.id), 150 + index * 50));

    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, [completeUnlock, definitions, statusById]);

  return null;
}
