'use client';

import { useTranslations } from 'next-intl';

import type { Dataset } from '@/shared/api';
import { Checkbox, Label } from '@/shared/ui';

/** Thirteen markets with checkboxes, grouped by region. */
export function MarketsField({
  id,
  ds,
  value,
  onChange,
  error,
}: {
  id: string;
  ds: Dataset;
  value: readonly string[];
  onChange: (ids: string[]) => void;
  error: string | null;
}) {
  const t = useTranslations('alerts.form');
  const errorId = `${id}-error`;
  const toggle = (marketId: string, on: boolean) => {
    // Kept in dataset order, so the rule reads the same however it was ticked.
    onChange(
      ds.markets.filter((m) => (m.id === marketId ? on : value.includes(m.id))).map((m) => m.id),
    );
  };
  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      className="flex flex-col gap-2"
    >
      <legend className="mb-1.5 text-sm font-medium">{t('markets')}</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {ds.regions.map((region) => (
          <div key={region.id} className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">{region.name}</p>
            {ds.markets
              .filter((m) => m.regionId === region.id)
              .map((m) => {
                const checkboxId = `${id}-${m.id}`;
                return (
                  <div key={m.id} className="flex min-h-9 items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={value.includes(m.id)}
                      onCheckedChange={(checked) => {
                        toggle(m.id, checked === true);
                      }}
                    />
                    <Label htmlFor={checkboxId} className="font-normal">
                      {m.name}
                    </Label>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
