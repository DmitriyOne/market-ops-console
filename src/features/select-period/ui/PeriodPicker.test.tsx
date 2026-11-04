import { screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { PeriodPicker } from './PeriodPicker';

const t = en.period;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <PeriodPicker />
    </Suspense>,
    { searchParams },
  );
}

describe('PeriodPicker', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('names the current period and range', async () => {
    setup('?period=2026-03&range=3m');
    expect(
      await screen.findByRole('button', {
        name: 'Period: Mar 2026, 3 months. Change period',
      }),
    ).toHaveTextContent('Mar 2026 · 3 months');
  });

  it('picking a month writes it to the URL with a history entry and closes', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: /^Period: May 2026/ }));
    await user.click(screen.getByRole('button', { name: 'Feb 2026' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?period=2026-02');
    });
    expect(lastUpdate()?.options.history).toBe('push');
    expect(screen.queryByRole('group', { name: 'Months of 2026' })).not.toBeInTheDocument();
  });

  it('the latest month and 1 month are the defaults, so they leave the URL', async () => {
    const { user, lastUpdate } = setup('?period=2026-02&range=12m');
    await user.click(await screen.findByRole('button', { name: /^Period: Feb 2026/ }));
    await user.click(screen.getByRole('radio', { name: t.range['1m'] }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('?period=2026-02');
    });
    await user.click(screen.getByRole('button', { name: 'May 2026' }));
    await waitFor(() => {
      expect(lastUpdate()?.queryString).toBe('');
    });
  });

  it('the range is a radio group labelled with the window end', async () => {
    const { user } = setup('?period=2026-03');
    await user.click(await screen.findByRole('button', { name: /^Period: Mar 2026/ }));
    const group = screen.getByRole('radiogroup', { name: 'Months ending in Mar 2026' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: t.range['1m'] })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
