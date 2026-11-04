import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';
import { datasetHandler, renderWithProviders, server } from '@/shared/lib/test';

import { DashboardPage } from './DashboardPage';

vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@wrksz/themes/client', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a failed dataset is one message for the whole page; header and assistant stay', async () => {
    server.use(datasetHandler({ status: 500 }));
    renderWithProviders(<DashboardPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(en.errors.dataFailed);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    // The header keeps what does not need data: name, language, theme.
    expect(screen.getByText(en.common.appName)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: en.drill.label })).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: en.shell.assistant })).toBeInTheDocument();
  });

  it('with data the header shows the drill-down path', async () => {
    server.use(datasetHandler());
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole('navigation', { name: en.drill.label })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument();
  });
});
