import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import de from '@/shared/config/i18n/messages/de.json';
import ru from '@/shared/config/i18n/messages/ru.json';

import GlobalError from './global-error';

vi.mock('@/app/fonts', () => ({ fontVariables: '' }));

const path = vi.hoisted(() => ({ current: '/ru-RU/dashboard' }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => path.current,
}));

// It renders <html> and <body>; inside the test's <div> React warns about it.
const renderPage = (error: Error & { digest?: string }, reset = vi.fn()) => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render(<GlobalError error={error} reset={reset} />);
  return reset;
};

describe('global error page', () => {
  it("speaks the address's language, shows the error ID and retries", async () => {
    path.current = '/ru-RU/dashboard';
    const reset = renderPage(Object.assign(new Error('layout'), { digest: 'd1' }));
    expect(screen.getByRole('heading', { level: 1, name: ru.errorPage.title })).toBeInTheDocument();
    expect(screen.getByText('Код ошибки: d1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ru.errorPage.home })).toHaveAttribute(
      'href',
      '/ru-RU/dashboard',
    );
    expect(document.title).toBe('Что-то пошло не так · Market Ops Console');
    await userEvent.click(screen.getByRole('button', { name: ru.errors.retry }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('logs the error once, marked as the global boundary', () => {
    path.current = '/de-DE/x';
    const error = new Error('layout');
    renderPage(error);
    expect(screen.getByRole('heading', { level: 1, name: de.errorPage.title })).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      '[ui]',
      expect.objectContaining({ boundary: 'global', error }),
    );
  });

  it('links the default locale without its prefix', () => {
    path.current = '/dashboard';
    renderPage(new Error('layout'));
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});
