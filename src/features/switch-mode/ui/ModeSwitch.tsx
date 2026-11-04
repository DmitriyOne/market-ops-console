'use client';

import { useTranslations } from 'next-intl';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { type Mode, MODES } from '@/entities/performance';
import { cn } from '@/shared/lib';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui';

const modeParser = parseAsStringLiteral(MODES).withDefault('executive').withOptions({
  // Analyst is another screen to the user: Back returns to the previous mode.
  history: 'push',
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
      spacing={1}
      className={cn('rounded-xl bg-muted p-1', className)}
    >
      {MODES.map((m) => (
        <ToggleGroupItem
          key={m}
          value={m}
          className="min-h-11 flex-1 px-4 hover:bg-card/60 data-[state=on]:bg-card data-[state=on]:shadow-sm"
        >
          {t(m)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
