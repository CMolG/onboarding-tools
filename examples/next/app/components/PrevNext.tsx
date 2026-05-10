'use client';

import Link from 'next/link';
import { useUnlockableContext } from 'onboarding-tools/react';

import { getPrevNext } from '@/app/lib/nav';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

export function PrevNext({ sectionId }: { readonly sectionId: string }) {
  const { previous, next } = getPrevNext(sectionId);
  const { statusById } = useUnlockableContext();
  const nextStatus = next ? statusById[next.id] ?? 'HIDDEN' : 'HIDDEN';
  const nextAvailable = Boolean(next && nextStatus !== 'HIDDEN');

  return (
    <nav className="mt-10 flex flex-col gap-3 border-t border-docs-outline-variant pt-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Previous and next sections">
      {previous ? (
        <Link href={previous.route} className="md3-button-outlined" onClick={resetScroll}>
          <ArrowLeftIcon className="size-4" /> {previous.title}
        </Link>
      ) : <span />}
      {next ? (
        nextAvailable ? (
          <Link href={next.route} className="md3-button-tonal text-right" onClick={resetScroll}>
            {next.title} <ArrowRightIcon className="size-4" />
          </Link>
        ) : (
          <span className="md3-chip min-h-10 border-dashed px-4 text-sm">
            {next.title} locked
          </span>
        )
      ) : null}
    </nav>
  );
}

function resetScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}
