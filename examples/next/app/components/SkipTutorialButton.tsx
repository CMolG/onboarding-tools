'use client';

import { useState } from 'react';
import { useUnlockable } from 'onboarding-tools/react';

import { ConfirmModal } from './ConfirmModal';
import { PlayIcon } from './Icons';
import { useToast } from './Toast';

export function SkipTutorialButton({ compact = false }: { readonly compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { skipUnlocks } = useUnlockable('welcome');
  const { showToast } = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact ? 'md3-button px-4' : 'md3-button'}
      >
        <span>{compact ? 'Skip' : 'Skip tutorial'}</span>
        <PlayIcon className="size-4" />
      </button>
      <ConfirmModal
        open={open}
        title="Skip the interactive tutorial?"
        confirmLabel="Skip tutorial"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          skipUnlocks();
          setOpen(false);
          showToast('Tutorial skipped. Progress saved.');
        }}
      >
        <p>All sections will be marked as unlocked. You can still explore the playgrounds; only the progressive reveal animation will be skipped.</p>
        <p>This calls the public API <code>skipUnlocks()</code>. Inspect localStorage afterwards to see how state is persisted.</p>
      </ConfirmModal>
    </>
  );
}
