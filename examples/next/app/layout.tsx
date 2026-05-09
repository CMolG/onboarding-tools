import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import 'onboarding-tools/styles.css';
import './globals.css';
import { Providers } from './Providers';
import { Shell } from './Shell';

export const metadata: Metadata = {
  title: 'onboarding-tools · Next.js example',
  description: 'Declarative unlockable onboarding for any React app.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
