import type { ReactNode } from 'react';

import { DocsShell } from '../DocsShell';

export default function DocsLayout({ children }: { readonly children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
