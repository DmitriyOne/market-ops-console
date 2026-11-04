'use client';

import { useTranslations } from 'next-intl';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { type Mode, MODES } from '@/entities/performance';
import { cn } from '@/shared/lib';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui';

const modeParser = parseAsStringLiteral(MODES).withDefault('executive').withOptions({
  // A different view of the same place, not a new place: no history step.
  history: 'replace',
  clearOnDefault: true,
});

const isMode = (v: string): v is Mode => MODES.some((m) => m === v);

/** Executive overview or analyst deep-dive (spec §8 Modes). */
export function ModeSwitch({ className }: { className?: string }) {
  const t = useTranslations('mode');
  const [mode, setMode] = useQueryState('mode', modeParser);
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(next) => {
        // Radix sends '' when the active item is pressed again: keep the mode.
        if (isMode(next) && next !== mode) void setMode(next);
      }}
      aria-label={t('label')}
      spacing={0}
      className={cn('rounded-lg bg-muted p-0.5', className)}
    >
      {MODES.map((m) => (
        <ToggleGroupItem
          key={m}
          value={m}
          className="min-h-11 flex-1 px-3 data-[state=on]:bg-card data-[state=on]:shadow-sm"
        >
          {t(m)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
