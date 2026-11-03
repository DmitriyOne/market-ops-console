'use client';

import {
  CircleSlashIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  SparklesIcon,
  SquareIcon,
  TriangleAlertIcon,
} from 'lucide-react';
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
  high: { Icon: SignalHighIcon, className: 'text-confidence-high' },
  medium: { Icon: SignalMediumIcon, className: 'text-confidence-medium' },
  low: { Icon: SignalLowIcon, className: 'text-confidence-low' },
} as const;

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
  const { Icon, className } = CONFIDENCE[confidence];
  return (
    <p className={cn('flex items-center gap-1.5 text-sm font-semibold', className)}>
      <Icon aria-hidden className="size-4" />
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
};

export function AnswerMessage({
  message,
  ds,
  onAsk,
  onRetry,
  onSource,
  onHighlight,
}: AnswerMessageProps) {
  const t = useTranslations('assistant');
  const tRoot = useTranslations();
  const f = useKpiFormat();
  const { status, kind, text, citations, confidence, error } = message;

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

  if (kind === 'abstain') {
    const first = ds?.meta.periods[0];
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted p-3 text-sm">
        <p className="flex items-center gap-1.5 font-semibold">
          <CircleSlashIcon aria-hidden className="size-4" />
          {t('abstain.title')}
        </p>
        <Paragraphs text={text} />
        {ds && first ? (
          <p className="text-xs text-muted-foreground">
            {t('abstain.coverage', { from: f.period(first), to: f.period(ds.meta.latestPeriod) })}
          </p>
        ) : null}
        <SuggestedQuestions onAsk={onAsk} />
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
