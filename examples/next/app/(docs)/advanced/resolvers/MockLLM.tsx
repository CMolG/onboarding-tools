'use client';

import { useState } from 'react';
import type { UnlockDecision } from 'onboarding-tools';
import { useUnlockableEvents } from 'onboarding-tools/react';

const initialProfile = 'Senior IC, ships UI systems, wants advanced configuration and AI personalization.';

export function MockLLMResolver() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState<readonly UnlockDecision[]>([]);
  const { events, emitEvent } = useUnlockableEvents();

  async function runResolver() {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    const next: readonly UnlockDecision[] = [
      {
        unlockableId: 'storage',
        unlock: profile.toLowerCase().includes('advanced'),
        resolverId: 'mock-llm',
        reason: 'The profile mentions advanced configuration work.',
        matchedSignals: ['advanced', 'configuration'],
        confidence: 0.86,
      },
      {
        unlockableId: 'api-reference',
        unlock: true,
        resolverId: 'mock-llm',
        reason: 'Technical users benefit from seeing the API surface early.',
        matchedSignals: ['technical'],
        confidence: 0.74,
      },
    ];
    setDecisions(next);
    setLoading(false);
    if (!events.includes('resolver.invoked')) {
      emitEvent('resolver.invoked');
    }
  }

  return (
    <section id="profile-prompt" data-tour="mock-llm-resolver" className="md3-card-elevated p-4 sm:p-5">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-docs-text-muted">User profile</span>
        <textarea
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
          rows={5}
          className="md3-field w-full resize-y p-3 text-sm leading-6 outline-none"
        />
      </label>
      <button
        type="button"
        onClick={runResolver}
        disabled={loading}
        className="md3-button mt-3 disabled:opacity-60"
      >
        {loading ? 'Running resolver...' : 'Run resolver'}
      </button>
      <div id="decision" className="mt-4 grid gap-3">
        {decisions.map((decision) => (
          <article key={decision.unlockableId} className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-docs-mono text-sm font-semibold text-docs-text">{decision.unlockableId}</span>
              <span className={decision.unlock ? 'md3-chip border-transparent bg-docs-success-soft text-docs-success' : 'md3-chip border-transparent bg-docs-rose-soft text-docs-rose'}>
                {decision.unlock ? 'unlock' : 'hold'}
              </span>
              <span className="text-xs text-docs-text-muted">{Math.round((decision.confidence ?? 0) * 100)}%</span>
            </div>
            <p className="mt-2 text-sm text-docs-text-muted">{decision.reason}</p>
          </article>
        ))}
      </div>
      <p id="integration" className="mt-4 text-sm text-docs-text-muted">
        A production resolver can call OpenAI, Anthropic, or an internal model. The provider only needs an <code>UnlockDecision[]</code>.
      </p>
    </section>
  );
}
