'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UnlockStatus } from 'onboarding-tools';

import type { DocsSection } from '@/app/lib/nav';
import { cn } from '@/app/lib/utils';
import { StatusIcon } from './Icons';

export function RailItem({
  section,
  status,
  index,
  onNavigate,
}: {
  readonly section: DocsSection;
  readonly status: UnlockStatus;
  readonly index: number;
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '/';
  const active = pathname === section.route;
  const previous = useRef(status);
  const hydrationWindowUntil = useRef(Date.now() + 900);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (previous.current !== 'UNLOCKED' && status === 'UNLOCKED') {
      if (Date.now() < hydrationWindowUntil.current) {
        setIsNew(false);
        previous.current = status;
        return;
      }
      setIsNew(true);
      const timeout = window.setTimeout(() => setIsNew(false), 3000);
      previous.current = status;
      return () => window.clearTimeout(timeout);
    }
    previous.current = status;
  }, [status]);

  return (
    <Link
      href={section.route}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        setIsNew(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        onNavigate?.();
      }}
      className={cn(
        'md3-nav-item group min-w-0 text-sm font-semibold',
        active && 'md3-nav-item-active',
      )}
      style={isNew ? { animation: `docs-stagger-unlock 220ms ease ${index * 35}ms both` } : undefined}
    >
      <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-docs-surface text-docs-accent', status === 'UNLOCKING' && 'animate-spin')}>
        <StatusIcon status={status} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{section.title}</span>
      <span className="inline-flex w-10 shrink-0 justify-end">
        <span className={cn('rounded-full bg-docs-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-normal text-white transition-opacity', isNew ? 'opacity-100' : 'opacity-0')} aria-hidden={!isNew}>
          New
        </span>
      </span>
    </Link>
  );
}
