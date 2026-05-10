'use client';

import { useEffect, useRef, useState } from 'react';

import { highlightCode } from '@/app/lib/highlight';
import { useToast } from './Toast';

export function CodeBlock({
  code,
  lang = 'tsx',
  copyLabel = 'Copy',
}: {
  readonly code: string;
  readonly lang?: string;
  readonly copyLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    let cancelled = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }
      observer.disconnect();
      highlightCode(code, lang).then((nextHtml) => {
        if (!cancelled) {
          setHtml(nextHtml);
        }
      });
    }, { rootMargin: '160px' });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [code, lang]);

  return (
    <div ref={ref} className="overflow-hidden rounded-docs-lg border border-docs-outline-variant bg-docs-bg-code shadow-docs-sm">
      <div className="flex items-center justify-between border-b border-docs-outline-variant bg-docs-surface-container-low px-3 py-2">
        <span className="font-docs-mono text-xs font-semibold text-docs-text-muted">{lang}</span>
        <button
          type="button"
          className="md3-chip min-h-7 px-2 py-1 text-xs hover:border-docs-accent hover:text-docs-accent"
          onClick={async () => {
            try {
              await navigator.clipboard?.writeText(code);
              showToast('Code copied.');
            } catch {
              showToast('Copy failed. Select the code manually.');
            }
          }}
        >
          {copyLabel}
        </button>
      </div>
      {html ? (
        <div className="docs-scrollbar max-h-[32rem] overflow-auto text-[13px] leading-6 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-4" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="docs-scrollbar m-0 max-h-[32rem] overflow-auto p-4 text-[13px] leading-6 text-docs-text">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
