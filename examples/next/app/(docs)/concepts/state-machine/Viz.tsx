'use client';

import { useEffect, useState } from 'react';
import { useUnlockableEvents } from 'onboarding-tools/react';

import type { UnlockStatus } from 'onboarding-tools';

const states: UnlockStatus[] = ['HIDDEN', 'ELIGIBLE', 'UNLOCKING', 'UNLOCKED'];

export function StateMachineVisualizer() {
  const [index, setIndex] = useState(0);
  const { events, emitEvent } = useUnlockableEvents();
  const active = states[index];

  useEffect(() => {
    if (active === 'UNLOCKED' && !events.includes('state-machine.cycled')) {
      emitEvent('state-machine.cycled');
    }
  }, [active, emitEvent, events]);

  return (
    <section id="lifecycle" data-tour="state-machine-viz" className="md3-card-elevated p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-docs-text">Lifecycle</h2>
          <p className="mt-1 text-sm text-docs-text-muted">Step through the same legal transitions enforced by the core state machine.</p>
        </div>
        <button
          type="button"
          className="md3-button"
          onClick={() => setIndex((current) => Math.min(current + 1, states.length - 1))}
        >
          Step
        </button>
      </div>
      <svg viewBox="0 0 720 180" className="mt-5 h-auto w-full" role="img" aria-label="Unlockable state machine">
        {states.map((state, stateIndex) => {
          const x = 80 + stateIndex * 180;
          const isActive = state === active;
          return (
            <g key={state}>
              {stateIndex > 0 ? (
                <>
                  <line x1={x - 126} y1={90} x2={x - 58} y2={90} stroke="#79747e" strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x={x - 92} y={76} textAnchor="middle" className="fill-docs-text-muted text-[11px]">
                    {stateIndex === 1 ? 'criteria met' : stateIndex === 2 ? 'confirm/auto' : 'effect done'}
                  </text>
                </>
              ) : null}
              <rect x={x - 55} y={54} width={110} height={72} rx={18} fill={isActive ? '#d3e3fd' : '#f7f2fa'} stroke={isActive ? '#0b57d0' : '#cac4d0'} strokeWidth={isActive ? 3 : 1.5} />
              <text x={x} y={95} textAnchor="middle" className="fill-docs-text text-[14px] font-bold">
                {state}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#79747e" />
          </marker>
        </defs>
      </svg>
      <div id="transitions" className="mt-4 grid gap-3 sm:grid-cols-3">
        {['Automatic activation moves ELIGIBLE to UNLOCKING.', 'Manual activation waits for confirmUnlock(id).', 'UNLOCKED is terminal and persisted.'].map((item) => (
          <p key={item} className="m-0 rounded-docs-lg bg-docs-surface-container-low p-3 text-sm text-docs-text-muted">{item}</p>
        ))}
      </div>
      <p id="persistence" className="mt-4 text-sm text-docs-text-muted">
        Current demo status: <code>{active}</code>
      </p>
    </section>
  );
}
