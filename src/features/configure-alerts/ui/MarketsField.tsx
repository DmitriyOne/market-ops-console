'use client';

import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import type { Dataset } from '@/shared/api';
import { Checkbox, Label } from '@/shared/ui';

/**
 * Thirteen markets with checkboxes, grouped by region. `ref` goes to the
 * first one, so a save without a market focuses it; every checkbox reads
 * the error. Each whole row (≥44 px) toggles its market.
 */
export function MarketsField({
  id,
  ds,
  value,
  onChange,
  error,
  ref,
}: {
  id: string;
  ds: Dataset;
  value: readonly string[];
  onChange: (ids: string[]) => void;
  error: string | null;
  ref?: Ref<HTMLButtonElement>;
}) {
  const t = useTranslations('alerts.form');
  const errorId = `${id}-error`;
  const toggle = (marketId: string, on: boolean) => {
    // Kept in dataset order, so the rule reads the same however it was ticked.
    onChange(
      ds.markets.filter((m) => (m.id === marketId ? on : value.includes(m.id))).map((m) => m.id),
    );
  };
  // The first one shown: the first region's first market.
  const firstId = ds.markets.find((m) => m.regionId === ds.regions[0]?.id)?.id;
  return (
    <fieldset aria-invalid={error ? true : undefined} className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">{t('markets')}</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {ds.regions.map((region) => (
          <div key={region.id} className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground">{region.name}</p>
            {ds.markets
              .filter((m) => m.regionId === region.id)
              .map((m) => {
                const checkboxId = `${id}-${m.id}`;
                return (
                  <Label
                    key={m.id}
                    htmlFor={checkboxId}
                    className="min-h-11 cursor-pointer gap-2 font-normal"
                  >
                    <Checkbox
                      ref={m.id === firstId ? ref : undefined}
                      id={checkboxId}
                      checked={value.includes(m.id)}
                      aria-describedby={error ? errorId : undefined}
                      onCheckedChange={(checked) => {
                        toggle(m.id, checked === true);
                      }}
                    />
                    {m.name}
                  </Label>
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
