import { useLocation, useNavigate } from 'react-router-dom';
import type { OnboardingRouterAdapter } from 'onboarding-tools/react';

/**
 * Adapts react-router-dom v6 to the OnboardingRouterAdapter interface.
 * Pass the result to UnlockableFlowProvider and UnlockableTutorialEngineProvider.
 */
export function useOnboardingRouter(): OnboardingRouterAdapter {
  const location = useLocation();
  const navigate = useNavigate();

  return {
    pathname: location.pathname,
    navigate: (path, options) => navigate(path, { replace: options?.replace }),
  };
}
