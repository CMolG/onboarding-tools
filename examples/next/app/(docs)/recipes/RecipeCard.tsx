'use client';

import { useState } from 'react';

import { CodeBlock } from '@/app/components/CodeBlock';

const recipes = [
  {
    label: 'Vite + router',
    code: `import { useLocation, useNavigate } from 'react-router-dom';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';

function useOnboardingRouter(): OnboardingRouterAdapter {
  const location = useLocation();
  const navigate = useNavigate();
  return {
    pathname: location.pathname,
    navigate: (path, options) => navigate(path, { replace: options?.replace }),
  };
}`,
  },
  {
    label: 'Next App Router',
    code: `'use client';
import { usePathname, useRouter } from 'next/navigation';

function useOnboardingRouter() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  return {
    pathname,
    navigate: (path, options) => options?.replace ? router.replace(path) : router.push(path),
  };
}`,
  },
  {
    label: 'Remix',
    code: `// Mount providers in the client tree of app/root.tsx.
// Storage is no-op on the server and hydrates from localStorage on the client.`,
  },
  {
    label: 'No router',
    code: `<UnlockableFlowProvider>
  <UnlockableTutorialEngineProvider>
    {children}
  </UnlockableTutorialEngineProvider>
</UnlockableFlowProvider>`,
  },
] as const;

export function RecipeCard() {
  const [active, setActive] = useState<string>(recipes[0].label);
  const recipe = recipes.find((item) => item.label === active) ?? recipes[0];

  return (
    <section id="frameworks" data-tour="recipe-tabs" className="md3-card-elevated p-4 sm:p-5">
      <div className="md3-segmented flex-wrap" aria-label="Framework recipe">
        {recipes.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={active === item.label}
            onClick={() => setActive(item.label)}
            className="md3-segmented-item"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id="copy" className="mt-4">
        <CodeBlock code={recipe.code} />
      </div>
    </section>
  );
}
