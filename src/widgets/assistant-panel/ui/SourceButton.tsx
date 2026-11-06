'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { resolveCitation, type ResolvedCitation, useKpiFormat } from '@/entities/performance';
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

type SourceButtonProps = {
  citation: Citation;
  ds: Dataset | undefined;
  /** Shown instead of "Loading data…" when the dataset failed to load. */
  dataError?: string | null;
  onSelect: (r: ResolvedCitation) => void;
};

const TRIGGER = 'min-h-11 rounded-lg border-surface-ai-border text-surface-ai-label';

/**
 * The button is not on screen: a pick on a narrow window hides the panel,
 * the browser takes focus away (which ends the pick) and Radix's hover
 * timer, started before the click, would open the card with nothing to
 * anchor to, over the header. Without `checkVisibility` (older browsers,
 * tests) it counts as shown.
 */
function hidden(el: HTMLElement | null): boolean {
  return el !== null && 'checkVisibility' in el && !el.checkVisibility();
}

/**
 * One cited source. Fine pointers: hover or focus shows the evidence card,
 * click focuses the dashboard. Touch: tap opens the card, which has the button.
 */
export function SourceButton({ citation, ds, dataError = null, onSelect }: SourceButtonProps) {
  const t = useTranslations('assistant.evidence');
  const f = useKpiFormat();
  const coarse = useMediaQuery('(pointer: coarse)');
  const [open, setOpen] = useState(false);
  const resolved = ds ? resolveCitation(ds, citation) : null;
  const label = citation.label ?? (resolved ? f.scopeName(resolved) : t('loading'));
  const card = resolved ? (
    <EvidenceCard resolved={resolved} ds={ds} />
  ) : (
    <p className="text-sm text-muted-foreground">{dataError ?? t('loading')}</p>
  );
  // A press or a pick hides the card until the pointer or focus leaves the
  // button. Otherwise the press's focus and Radix's hover timer (the pointer
  // is still over it) reopen it while the dashboard changes, and it blinks.
  const picked = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const show = (next: boolean) => {
    if (next && (picked.current || hidden(trigger.current))) return;
    setOpen(next);
  };
  const release = () => {
    picked.current = false;
  };
  const select = () => {
    if (!resolved?.known) return;
    // Phones hide the panel next; an open card would stay over the dashboard.
    picked.current = true;
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
        {/* No closing fade: "Show on dashboard" hides the panel, the trigger goes
            with it, and a fading card would jump to the screen corner. */}
        <PopoverContent
          collisionPadding={15}
          className="flex w-72 flex-col gap-3 data-closed:animate-none!"
        >
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
    <HoverCard open={open} onOpenChange={show} openDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          ref={trigger}
          type="button"
          variant="outline"
          className={TRIGGER}
          onPointerDown={() => {
            picked.current = true;
            setOpen(false);
          }}
          onPointerLeave={release}
          onFocus={() => {
            show(true);
          }}
          onBlur={() => {
            release();
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
