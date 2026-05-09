export interface OnboardingRouterAdapter {
  readonly pathname: string;
  readonly navigate: (path: string, options?: { replace?: boolean }) => void;
}
