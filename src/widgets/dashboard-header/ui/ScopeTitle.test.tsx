import { screen } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { ScopeTitle } from './ScopeTitle';

function setup(searchParams = '') {
  return renderWithProviders(
    <Suspense>
      <ScopeTitle />
    </Suspense>,
    { searchParams },
  );
}

describe('ScopeTitle', () => {
  beforeEach(() => {
    server.use(datasetHandler());
  });

  it('portfolio: name and what it holds', async () => {
    setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument();
    expect(screen.getByText('13 markets · 5 products · latest data May 2026')).toBeInTheDocument();
  });

  it('has Share link next to the title', async () => {
    setup('?region=eu');
    await screen.findByRole('heading', { level: 1, name: 'Europe' });
    expect(screen.getByRole('button', { name: 'Share link' })).toBeInTheDocument();
  });

  it('region', async () => {
    setup('?region=eu');
    expect(await screen.findByRole('heading', { level: 1, name: 'Europe' })).toBeInTheDocument();
    expect(screen.getByText('5 markets · 5 products · latest data May 2026')).toBeInTheDocument();
  });

  it('product in a market', async () => {
    setup('?region=eu&market=de&product=veltrix');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Veltrix · Germany' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 market · 1 product · latest data May 2026')).toBeInTheDocument();
  });

  it('names the view and what it adds, so a mode switch shows at the top', async () => {
    const { unmount } = setup();
    expect(await screen.findByText('Executive view')).toBeInTheDocument();
    expect(
      screen.getByText('Headlines: KPIs, market status, risks and the revenue trend.'),
    ).toBeInTheDocument();
    unmount();
    setup('?mode=analyst');
    expect(await screen.findByText('Analyst view')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Adds the map metric, the comparison radar, the markets table and the heat map below.',
      ),
    ).toHaveAttribute('aria-live', 'polite');
  });
});
