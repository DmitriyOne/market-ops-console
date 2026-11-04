'use client';

import { useTheme } from '@wrksz/themes/client';
import { CircleCheckIcon, OctagonXIcon } from 'lucide-react';
import { toast as sonner, Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * sonner's toaster with the project theme. Toasts are as wide as their text,
 * centred, up to `--width` (sonner's own toasts are always `--width` wide).
 */
function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme();
  return (
    <Sonner
      theme={theme}
      style={{ '--width': 'min(28rem, calc(100vw - 2rem))' } as React.CSSProperties}
      // The toast slot spans --width; the visible box inside is centred.
      toastOptions={{ style: { width: 'var(--width)' } }}
      {...props}
    />
  );
}

function show(kind: 'success' | 'error', message: string) {
  return sonner.custom(() => (
    <div className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-sm">
      {kind === 'success' ? (
        <CircleCheckIcon aria-hidden className="size-4 shrink-0" />
      ) : (
        <OctagonXIcon aria-hidden className="size-4 shrink-0 text-destructive" />
      )}
      <span>{message}</span>
    </div>
  ));
}

/** Short confirmations and failures; sonner announces them in its live region. */
const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
};

export { toast, Toaster };
