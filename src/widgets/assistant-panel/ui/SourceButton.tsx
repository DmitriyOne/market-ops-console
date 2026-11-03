'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { resolveCitation, type ResolvedCitation } from '@/entities/performance';
import type { Citation, Dataset } from '@/shared/api';
import { useMediaQuery } from '@/shared/lib';
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui';

import { EvidenceCard } from './EvidenceCard';
import { useKpiFormat } from './use-kpi-format';

type SourceButtonProps = {
  citation: Citation;
  ds: Dataset | undefined;
  onSelect: (r: ResolvedCitation) => void;
};

const TRIGGER = 'min-h-11 rounded-lg border-surface-ai-border text-surface-ai-label';

/**
 * One cited source. Fine pointers: hover or focus shows the evidence card,
 * click focuses the dashboard. Touch: tap opens the card, which has the button.
 */
export function SourceButton({ citation, ds, onSelect }: SourceButtonProps) {
  const t = useTranslations('assistant.evidence');
  const f = useKpiFormat();
  const coarse = useMediaQuery('(pointer: coarse)');
  const [open, setOpen] = useState(false);
  const resolved = ds ? resolveCitation(ds, citation) : null;
  const label = citation.label ?? (resolved ? f.scopeName(resolved) : t('loading'));
  const card = resolved ? (
    <EvidenceCard resolved={resolved} ds={ds} />
  ) : (
    <p className="text-sm text-muted-foreground">{t('loading')}</p>
  );
  const select = () => {
    if (!resolved?.known) return;
    // Phones hide the panel next; an open card would stay over the dashboard.
    setOpen(false);
    onSelect(resolved);
  };

  if (coarse) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={TRIGGER}>
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent collisionPadding={15} className="flex w-72 flex-col gap-3">
          {card}
          {resolved?.known ? (
            <Button type="button" className="min-h-11" onClick={select}>
              {t('showOnDashboard')}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={TRIGGER}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
          }}
          onClick={select}
        >
          {label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent collisionPadding={15} className="flex w-72 flex-col gap-2">
        {card}
        {resolved?.known ? <p className="text-xs text-muted-foreground">{t('clickHint')}</p> : null}
      </HoverCardContent>
    </HoverCard>
  );
}
