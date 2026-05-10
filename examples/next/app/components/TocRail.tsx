'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { sectionById } from '@/app/lib/nav';

export function TocRail({ sectionId }: { readonly sectionId: string }) {
  const section = sectionById[sectionId];
  const [activeAnchor, setActiveAnchor] = useState(section.anchors[0] ?? '');

  useEffect(() => {
    const elements = section.anchors
      .map((anchor) => document.getElementById(slugify(anchor)))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
        if (visible?.target.id) {
          const anchor = section.anchors.find((item) => slugify(item) === visible.target.id);
          if (anchor) {
            setActiveAnchor(anchor);
          }
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: [0, 1] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [section.anchors]);

  return (
    <aside className="sticky top-[calc(var(--docs-topbar-height)+1rem)] hidden h-[calc(100vh-var(--docs-topbar-height)-2rem)] w-[var(--docs-toc-width)] shrink-0 px-5 py-2 xl:block">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-docs-text-muted">On this page</h2>
      <nav className="mt-3 space-y-2" aria-label="On this page">
        {section.anchors.map((anchor) => (
          <a
            key={anchor}
            href={`#${slugify(anchor)}`}
            className={activeAnchor === anchor ? 'block rounded-full bg-docs-accent-soft px-3 py-2 text-sm font-bold text-docs-on-accent-soft' : 'block rounded-full px-3 py-2 text-sm text-docs-text-muted hover:bg-docs-surface-container-low hover:text-docs-text'}
          >
            {anchor}
          </a>
        ))}
      </nav>
      <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-docs-text-muted">Related</h2>
      <div className="mt-3 space-y-2">
        {section.related.map((id) => {
          const related = sectionById[id];
          return related ? (
            <Link
              key={id}
              href={related.route}
              className="block text-sm text-docs-text-muted hover:text-docs-text"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
            >
              {related.title}
            </Link>
          ) : null;
        })}
      </div>
    </aside>
  );
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
