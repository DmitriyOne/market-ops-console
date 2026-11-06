import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({ setTags: vi.fn() }));
vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  setTags: sentry.setTags,
}));

const { TestProviders } = await import('@/shared/lib/test');
const { MonitoringTags } = await import('./monitoring-tags');

describe('MonitoringTags', () => {
  afterEach(() => {
    sentry.setTags.mockReset();
  });

  it('tags events with the language, mode, currency and tab from the screen', () => {
    render(
      <TestProviders searchParams="?mode=analyst&tab=alerts">
        <MonitoringTags />
      </TestProviders>,
    );
    expect(sentry.setTags).toHaveBeenLastCalledWith({
      locale: 'en-GB',
      mode: 'analyst',
      currency: 'USD',
      section: 'alerts',
    });
  });

  it('reads an unknown mode as Executive', () => {
    render(
      <TestProviders searchParams="?mode=hack">
        <MonitoringTags />
      </TestProviders>,
    );
    expect(sentry.setTags).toHaveBeenLastCalledWith(
      expect.objectContaining({ mode: 'executive', section: 'overview' }),
    );
  });
});
