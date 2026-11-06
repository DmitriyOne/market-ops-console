// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import raw from '@/data/data.json';
import type { ChatMessage } from '@/features/ask-question';
import { datasetSchema } from '@/shared/api';

import { useReportUnknownCitations } from './use-report-unknown-citations';

const answer = (id: string, citations: ChatMessage['citations']): ChatMessage => ({
  id,
  question: 'q',
  text: 'a',
  status: 'done',
  kind: 'normal',
  citations,
  confidence: 'high',
  error: null,
  notice: null,
});

const ds = datasetSchema.parse(raw);
const WARNING = 'unknown_citation';

describe('useReportUnknownCitations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once for a new answer citing a market or period the dataset lacks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = renderHook(
      ({ messages }) => {
        useReportUnknownCitations(ds, messages, true);
      },
      { initialProps: { messages: [] as ChatMessage[] } },
    );
    const bad = answer('a1', [
      { marketId: 'atlantis' },
      { marketId: 'de', period: '1999-01' },
      { marketId: 'de' },
    ]);
    rerender({ messages: [bad] });
    rerender({ messages: [bad] });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('[chat]', WARNING, {
      citations: [
        { marketId: 'atlantis', regionId: undefined, productId: undefined, period: undefined },
        { marketId: 'de', regionId: undefined, productId: undefined, period: '1999-01' },
      ],
    });
  });

  it('stays quiet for known citations and for answers restored after a reload', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const restored = answer('old', [{ marketId: 'atlantis' }]);
    const { rerender } = renderHook(
      ({ messages }) => {
        useReportUnknownCitations(ds, messages, true);
      },
      { initialProps: { messages: [restored] } },
    );
    rerender({ messages: [restored, answer('new', [{ marketId: 'de' }])] });
    expect(warn).not.toHaveBeenCalled();
  });
});
