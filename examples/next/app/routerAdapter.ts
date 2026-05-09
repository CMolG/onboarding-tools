'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';

/**
 * Adapts the Next.js App Router to the OnboardingRouterAdapter interface.
 * Must be called from a client component.
 */
export function useOnboardingRouter(): OnboardingRouterAdapter {
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  return {
    pathname,
    navigate: (path, options) => {
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    },
  };
}
