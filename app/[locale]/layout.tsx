import '@/app/styles/globals.css';

import type { ReactNode } from 'react';

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
