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
});
