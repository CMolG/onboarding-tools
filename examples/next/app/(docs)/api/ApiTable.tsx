'use client';

const rows = [
  ['UnlockableProvider', 'Provider', 'Owns state, storage, resolver, signals, flags, and persistence.'],
  ['UnlockableCatalogRegistrar', 'Component', 'Registers stable definitions under the provider.'],
  ['Unlockable', 'Component', 'Hides children until the definition reaches UNLOCKING or UNLOCKED.'],
  ['UnlockableFlowProvider', 'Provider', 'Derives stages, active stage, and completion from flow metadata.'],
  ['UnlockableTutorialEngineProvider', 'Provider', 'Runs spotlight and coach-card overlays against live DOM targets.'],
  ['useUnlockable(id)', 'Hook', 'Reads one status and exposes confirmUnlock() plus skipUnlocks().'],
  ['useUnlockableEvents()', 'Hook', 'Emits and reads event criteria.'],
  ['useUnlockableSignals()', 'Hook', 'Sets archetypes, signals, and flags.'],
  ['useUnlockableFlow()', 'Hook', 'Reads stages, activeStage, and completion helpers.'],
  ['createMemoryStorage()', 'Testing', 'Provides an in-memory storage adapter for tests and sandboxes.'],
] as const;

export function ApiTable() {
  return (
    <section id="hooks" data-tour="api-table" className="md3-card-elevated overflow-hidden">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-docs-surface-container-low">
          <tr>
            <th className="border-b border-docs-outline-variant px-4 py-3 font-extrabold text-docs-text">API</th>
            <th className="border-b border-docs-outline-variant px-4 py-3 font-extrabold text-docs-text">Kind</th>
            <th className="border-b border-docs-outline-variant px-4 py-3 font-extrabold text-docs-text">Use</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, kind, use]) => (
            <tr key={name} className="border-b border-docs-outline-variant last:border-b-0">
              <td className="px-4 py-3 font-docs-mono text-xs font-semibold text-docs-text">{name}</td>
              <td className="px-4 py-3 text-docs-text-muted">{kind}</td>
              <td className="px-4 py-3 text-docs-text-muted">{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div id="providers" className="border-t border-docs-outline-variant bg-docs-surface-container-low px-4 py-3 text-sm text-docs-text-muted">
        Non-optional hooks throw outside their provider. Optional variants are available for events and flow.
      </div>
      <div id="testing" className="border-t border-docs-outline-variant px-4 py-3 text-sm text-docs-text-muted">
        Tests should use <code>createMemoryStorage()</code> and assert persisted state by reading <code>storage.data</code>.
      </div>
    </section>
  );
}
