import type { ReactNode } from 'react';

import { Logo } from './logo';

type Props = {
  /** The status code, drawn large; the heading carries the meaning. */
  code: number;
  appName: string;
  skipLabel: string;
  title: string;
  body: string;
  /** A line under the text: the address not found, the error ID. */
  detail?: ReactNode;
  /** The buttons. */
  children: ReactNode;
};

/**
 * The 404 and 500 screen (0.13.0, design A): logo and app name in the corner,
 * the code, title, text and buttons centred; on a phone the buttons stay
 * under the text. Texts come in as props, so the global error page, which
 * has no i18n provider, can use it too.
 */
export function StatusScreen({ code, appName, skipLabel, title, body, detail, children }: Props) {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {skipLabel}
      </a>
      <div className="flex min-h-dvh flex-col bg-background p-4 text-foreground sm:px-8 sm:py-6">
        <header className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>{appName}</span>
        </header>
        <main
          id="main"
          className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center"
        >
          {/* `text-input`: 3.3:1 in both themes, enough for text this large
              (axe checks it although it is aria-hidden). */}
          <p
            aria-hidden
            className="font-mono text-7xl leading-none font-medium tracking-tighter text-input sm:text-8xl"
          >
            {code}
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          <p className="max-w-md text-muted-foreground">{body}</p>
          {detail}
          <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>
        </main>
      </div>
    </>
  );
}
