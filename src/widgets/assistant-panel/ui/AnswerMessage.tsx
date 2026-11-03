'use client';

import { CircleSlashIcon, SparklesIcon, SquareIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { ResolvedCitation } from '@/entities/performance';
import type { ChatMessage } from '@/features/ask-question';
import { SuggestedQuestions } from '@/features/ask-question';
import type { Confidence, Dataset } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { buildDataCheck } from '../model/data-check';
import { DataCheckBlock } from './DataCheckBlock';
import { SourceButton } from './SourceButton';
import { useKpiFormat } from './use-kpi-format';

const CONFIDENCE = {
  high: { bars: 3, className: 'text-confidence-high' },
  medium: { bars: 2, className: 'text-confidence-medium' },
  low: { bars: 1, className: 'text-confidence-low' },
} as const;

/** Three equal bars, `filled` of them solid: the level is the count, not a staircase. */
function ConfidenceMeter({ filled }: { filled: number }) {
  return (
    <span aria-hidden className="flex items-center gap-0.5">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn('h-3 w-1.5 rounded-sm bg-current', bar > filled && 'opacity-25')}
        />
      ))}
    </span>
  );
}

/** Answers that say the assistant could not answer from the data. */
export function isCantAnswer(m: ChatMessage): boolean {
  if (m.notice) return true;
  if (m.status !== 'done') return false;
  return m.kind === 'abstain' || (m.kind === 'low_confidence' && m.citations.length === 0);
}

/** AI text as plain paragraphs, never as HTML or Markdown. */
function Paragraphs({ text, caret }: { text: string; caret?: boolean }) {
  const parts = text.split(/\n\s*\n/);
  return parts.map((part, i) => (
    <p key={i} className="whitespace-pre-line">
      {part}
      {caret && i === parts.length - 1 ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-foreground align-text-bottom motion-reduce:animate-none"
        />
      ) : null}
    </p>
  ));
}

function ConfidenceLine({ confidence }: { confidence: Confidence }) {
  const t = useTranslations('assistant.answer');
  const { bars, className } = CONFIDENCE[confidence];
  return (
    <p className={cn('flex items-center gap-2 text-sm font-semibold', className)}>
      <ConfidenceMeter filled={bars} />
      {t('confidence', { level: t(confidence) })}
      {confidence === 'low' ? (
        <span className="font-normal text-muted-foreground">· {t('directional')}</span>
      ) : null}
    </p>
  );
}

function AiSurface({
  label,
  dashed,
  children,
}: {
  label: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-surface-ai-border bg-surface-ai p-3 text-sm',
        dashed && 'border-dashed',
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-surface-ai-label">
        <SparklesIcon aria-hidden className="size-3.5" />
        {label}
      </p>
      {children}
    </div>
  );
}

type AnswerMessageProps = {
  message: ChatMessage;
  ds: Dataset | undefined;
  onAsk: (question: string) => void;
  onRetry: (id: string) => void;
  onSource: (r: ResolvedCitation) => void;
  onHighlight: (marketIds: string[]) => void;
  /** Offer the suggested questions (after repeated "can't answer"). */
  showSuggestions?: boolean;
};

export function AnswerMessage({
  message,
  ds,
  onAsk,
  onRetry,
  onSource,
  onHighlight,
  showSuggestions = false,
}: AnswerMessageProps) {
  const t = useTranslations('assistant');
  const tRoot = useTranslations();
  const f = useKpiFormat();
  const { status, text, citations, confidence, error } = message;

  const check = useMemo(
    () => (ds && status === 'done' ? buildDataCheck(ds, citations) : null),
    [ds, status, citations],
  );

  if (status === 'streaming') {
    return (
      <AiSurface label={t('answer.writing')}>
        <Paragraphs text={text} caret />
        <p className="text-xs text-muted-foreground">{t('answer.pending')}</p>
      </AiSurface>
    );
  }

  if (status === 'stopped') {
    return (
      <div className="flex flex-col items-start gap-2">
        <AiSurface label={t('answer.label')} dashed>
          {text ? <Paragraphs text={text} /> : null}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SquareIcon aria-hidden className="size-3.5" />
            <span>
              <strong className="text-foreground">{t('stopped.title')}</strong> {t('stopped.body')}
            </span>
          </p>
        </AiSurface>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            onRetry(message.id);
          }}
        >
          {t('stopped.askAgain')}
        </Button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        {text ? (
          <AiSurface label={t('answer.label')}>
            <Paragraphs text={text} />
          </AiSurface>
        ) : null}
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-xl bg-status-off-track-muted p-3 text-sm text-status-off-track"
        >
          <p className="flex items-center gap-1.5 font-semibold">
            <TriangleAlertIcon aria-hidden className="size-4" />
            {t('error.title')}
          </p>
          <p className="text-foreground">
            {error && 'message' in error ? error.message : tRoot(error?.key ?? 'errors.unknown')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              onRetry(message.id);
            }}
          >
            {t('error.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (isCantAnswer(message)) {
    const first = ds?.meta.periods[0];
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted p-3 text-sm">
        <p className="flex items-center gap-1.5 font-semibold">
          <CircleSlashIcon aria-hidden className="size-4" />
          {message.notice ? t(`declined.${message.notice}`) : t('abstain.title')}
        </p>
        {text ? <Paragraphs text={text} /> : null}
        {!message.notice && ds && first ? (
          <p className="text-xs text-muted-foreground">
            {t('abstain.coverage', { from: f.period(first), to: f.period(ds.meta.latestPeriod) })}
          </p>
        ) : null}
        {showSuggestions ? <SuggestedQuestions onAsk={onAsk} /> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AiSurface label={t('answer.label')}>
        <Paragraphs text={text} />
        {confidence ? <ConfidenceLine confidence={confidence} /> : null}
        {citations.length > 0 ? (
          <ul aria-label={t('answer.sources')} className="flex flex-wrap gap-1.5">
            {citations.map((c, i) => (
              <li key={i}>
                <SourceButton citation={c} ds={ds} onSelect={onSource} />
              </li>
            ))}
          </ul>
        ) : null}
      </AiSurface>
      {ds && check ? <DataCheckBlock check={check} ds={ds} onHighlight={onHighlight} /> : null}
    </div>
  );
}
