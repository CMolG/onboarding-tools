'use client';

import { useState, type ReactNode } from 'react';

import { CodeBlock } from '@/app/components/CodeBlock';
import { ResetIcon } from '@/app/components/Icons';

type PlaygroundMode = 'preview' | 'code' | 'both';

export function Playground({
  title = 'Playground',
  controls,
  preview,
  code,
}: {
  readonly title?: string;
  readonly controls?: ReactNode;
  readonly preview: ReactNode;
  readonly code: string;
}) {
  const [mode, setMode] = useState<PlaygroundMode>('both');
  const [resetKey, setResetKey] = useState(0);

  return (
    <section className="md3-card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-docs-outline-variant bg-docs-surface-container-low px-4 py-3">
        <div>
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-docs-accent">Interactive playground</p>
          <h2 className="m-0 mt-0.5 text-base font-extrabold text-docs-text">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="md3-segmented" aria-label="Playground view mode">
            {(['preview', 'code', 'both'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
                className="md3-segmented-item"
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResetKey((current) => current + 1)}
            className="md3-icon-button"
            aria-label="Reset playground"
          >
            <ResetIcon className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        {mode !== 'code' ? (
          <div className="grid gap-4 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
            {controls ? <div className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-3">{controls}</div> : null}
            <div key={resetKey}>{preview}</div>
          </div>
        ) : null}
        {mode !== 'preview' ? <CodeBlock code={code} /> : null}
      </div>
    </section>
  );
}
