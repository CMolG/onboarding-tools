import { DocsPage } from '@/app/components/DocsPage';

export default function DeployPage() {
  return (
    <DocsPage sectionId="deploy">
      <section id="vercel" data-tour="deploy-panel" className="md3-card-elevated p-4 sm:p-5">
        <h2 className="m-0 text-lg font-extrabold text-docs-text">Vercel</h2>
        <p className="mt-2 text-sm leading-6 text-docs-text-muted">
          The existing <code>vercel.json</code> stays unchanged: it installs and builds the parent package, then runs <code>next build</code> for this example.
        </p>
        <a
          href="https://vercel.com/new/clone?repository-url=https://github.com/CMolG/onboarding-tools&project-name=onboarding-tools-docs&repository-name=onboarding-tools"
          className="md3-button mt-4"
        >
          Deploy with Vercel
        </a>
        <div id="build-graph" className="mt-6 grid gap-3 text-sm md:grid-cols-3">
          {['Root npm ci', 'npm run build', 'examples/next next build'].map((item, index) => (
            <div key={item} className="rounded-docs-lg border border-docs-outline-variant bg-docs-surface-container-low p-3">
              <span className="font-docs-mono text-xs text-docs-text-muted">0{index + 1}</span>
              <p className="mt-2 font-semibold text-docs-text">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </DocsPage>
  );
}
