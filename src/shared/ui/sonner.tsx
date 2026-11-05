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

type ToastAction = { label: string; onClick: () => void };

function show(kind: 'success' | 'error', message: string, action?: ToastAction) {
  return sonner.custom((id) => (
    <div className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-sm">
      {kind === 'success' ? (
        <CircleCheckIcon aria-hidden className="size-4 shrink-0" />
      ) : (
        <OctagonXIcon aria-hidden className="size-4 shrink-0 text-destructive" />
      )}
      <span>{message}</span>
      {action ? (
        <button
          type="button"
          className="ml-1 inline-flex min-h-11 shrink-0 items-center rounded-md px-2 font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            sonner.dismiss(id);
            action.onClick();
          }}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  ));
}

/** Short confirmations and failures; sonner announces them in its live region. */
const toast = {
  success: (message: string, action?: ToastAction) => show('success', message, action),
  /** With `action`, a button in the toast (e.g. Retry after a rollback). */
  error: (message: string, action?: ToastAction) => show('error', message, action),
};

export { toast, Toaster };
