'use client';

import { useState, type CSSProperties } from 'react';
import { useUnlockableEvents } from 'onboarding-tools/react';

import { NumberField } from '@/app/playground/controls/NumberField';

export function ThemeTokenPlayground() {
  const [primary, setPrimary] = useState(217);
  const [backdrop, setBackdrop] = useState(54);
  const [radius, setRadius] = useState(14);
  const [shadow, setShadow] = useState(6);
  const { events, emitEvent } = useUnlockableEvents();

  const changed = (setter: (value: number) => void) => (value: number) => {
    setter(value);
    if (!events.includes('theme.tweaked')) {
      emitEvent('theme.tweaked');
    }
  };

  const primaryColor = `hsl(${primary} 78% 28%)`;

  return (
    <section
      id="tokens"
      data-tour="theme-token-playground"
      className="md3-card-elevated grid gap-4 p-4 md:grid-cols-[16rem_minmax(0,1fr)]"
      style={{
        '--ot-color-primary': primaryColor,
        '--ot-color-backdrop': `rgb(15 23 42 / ${backdrop}%)`,
        '--ot-radius-card': `${radius}px`,
        '--ot-shadow-card': `0 2px 10px rgb(15 23 42 / ${shadow}%)`,
      } as CSSProperties}
    >
      <div className="space-y-4 rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-3">
        <NumberField label="primary hue" value={primary} min={190} max={230} onChange={changed(setPrimary)} />
        <NumberField label="backdrop" value={backdrop} min={20} max={75} onChange={changed(setBackdrop)} />
        <NumberField label="radius" value={radius} min={6} max={24} onChange={changed(setRadius)} />
        <NumberField label="shadow" value={shadow} min={0} max={10} onChange={changed(setShadow)} />
        <button
          type="button"
          className="md3-button-outlined w-full"
          onClick={() => {
            setPrimary(217);
            setBackdrop(54);
            setRadius(14);
            setShadow(6);
          }}
        >
          Reset defaults
        </button>
      </div>
      <div id="preview" className="relative min-h-80 overflow-hidden rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-6">
        <div className="absolute inset-0 bg-[var(--ot-color-backdrop)]" />
        <div className="relative mx-auto mt-8 w-[min(100%,24rem)] rounded-[var(--ot-radius-card)] border border-white/40 bg-docs-surface p-5 text-docs-text shadow-[var(--ot-shadow-card)]">
          <span className="rounded-full px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: primaryColor, background: 'color-mix(in srgb, var(--ot-color-primary) 14%, white)' }}>
            Overlay preview
          </span>
          <h2 className="mt-4 text-lg font-extrabold">Theme tokens</h2>
          <p className="mt-2 text-sm text-docs-text-muted">The package reads CSS custom properties, so consumers can theme overlays without changing React code.</p>
          <span className="mt-4 inline-flex rounded-docs-sm px-3 py-2 text-sm font-semibold text-white" style={{ background: primaryColor }}>
            Primary action
          </span>
        </div>
      </div>
    </section>
  );
}
