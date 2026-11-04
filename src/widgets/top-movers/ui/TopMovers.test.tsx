import { screen, waitFor, within } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { TopMovers } from './TopMovers';

const t = en.topMovers;

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <TopMovers />
    </Suspense>,
    { searchParams },
  );
}

describe('TopMovers', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('three risers and three fallers, each with its growth', async () => {
    setup();
    const section = await screen.findByRole('region', { name: t.title });
    const risers = within(section).getByRole('list', { name: t.risers });
    const fallers = within(section).getByRole('list', { name: t.fallers });
    expect(
      within(risers)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['China +18.2%', 'France +11.6%', 'Canada +10.7%']);
    expect(
      within(fallers)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Germany -9.7%', 'Spain -4.6%', 'Italy +0.3%']);
  });

  it('says what the growth is measured over', async () => {
    setup('?period=2026-03&range=3m');
    expect(await screen.findByText('Growth YoY, 3 months to Mar 2026')).toBeInTheDocument();
  });

  it('a row drills into the market', async () => {
    const { user, lastUpdate } = setup();
    await user.click(await screen.findByRole('button', { name: /^China/ }));
    await waitFor(() => {
      expect(Object.fromEntries(lastUpdate()?.searchParams ?? [])).toEqual({
        region: 'apac',
        market: 'cn',
      });
    });
  });
});
