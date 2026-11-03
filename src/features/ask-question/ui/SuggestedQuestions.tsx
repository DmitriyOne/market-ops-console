'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

import { SUGGESTED_QUESTIONS } from '../config/suggestions';

export function SuggestedQuestions({ onAsk }: { onAsk: (question: string) => void }) {
  const t = useTranslations('assistant.suggestions');
  return (
    <section aria-label={t('title')} className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t('title')}
      </h3>
      <ul className="flex flex-col gap-2">
        {SUGGESTED_QUESTIONS.map((s) => (
          <li key={s.id}>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-start rounded-full px-4 text-left whitespace-normal"
              onClick={() => {
                onAsk(s.question);
              }}
            >
              {t(s.id)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
