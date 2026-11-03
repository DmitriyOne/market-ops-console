import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimeoutError } from '@/shared/api';
import { enMessages as en } from '@/shared/config';

import { WidgetBoundary } from './widget-boundary';

let shouldFail = true;
function FlakyWidget() {
  if (shouldFail) throw new TimeoutError();
  return <p>{'widget content'}</p>;
}

function renderPage() {
  render(
    <NextIntlClientProvider locale="en-GB" messages={en}>
      <WidgetBoundary>
        <FlakyWidget />
      </WidgetBoundary>
      <p>{'other widget'}</p>
    </NextIntlClientProvider>,
  );
}

describe('WidgetBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    shouldFail = true;
  });

  it('contains a crash to its widget, explains it and logs it', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(en.errors.sectionTitle);
    expect(alert).toHaveTextContent(en.errors.timeout);
    expect(screen.getByText('other widget')).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith('[ui]', expect.objectContaining({ code: 'unknown' }));
  });

  it('renders the widget again after Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    shouldFail = false;
    await userEvent.click(screen.getByRole('button', { name: en.errors.retry }));
    expect(screen.getByText('widget content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
