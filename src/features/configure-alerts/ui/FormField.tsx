import type { ReactNode } from 'react';

import { Label } from '@/shared/ui';

/** Ids that tie a control to its label, hint and error. */
export function fieldIds(base: string) {
  return { control: `${base}-control`, hint: `${base}-hint`, error: `${base}-error` };
}

/** `aria-describedby` for a control: its hint and, when shown, its error. */
export function describedBy(base: string, hint: boolean, error: string | null) {
  const ids = fieldIds(base);
  return [hint ? ids.hint : null, error ? ids.error : null].filter(Boolean).join(' ') || undefined;
}

/** Label above, the control, then a hint and the error, all tied by id. */
export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | null;
  children: ReactNode;
}) {
  const ids = fieldIds(id);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={ids.control}>{label}</Label>
      {children}
      {hint ? (
        <p id={ids.hint} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={ids.error} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
