export function isDevelopmentRuntime(): boolean {
  const maybeProcess = (globalThis as {
    readonly process?: { readonly env?: { readonly NODE_ENV?: string } };
  }).process;
  return maybeProcess?.env?.NODE_ENV !== 'production';
}
