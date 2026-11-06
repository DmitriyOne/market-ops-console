import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { deMessages as de, ruMessages as ru } from '@/shared/config';

import { GlobalErrorPage } from './GlobalErrorPage';

describe('GlobalErrorPage', () => {
  it('speaks the language it is given, without an i18n provider', async () => {
    const reset = vi.fn();
    render(<GlobalErrorPage digest="d1" reset={reset} locale="ru-RU" messages={ru} />);
    expect(screen.getByRole('heading', { level: 1, name: ru.errorPage.title })).toBeInTheDocument();
    expect(screen.getByText('Код ошибки: d1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ru.errorPage.home })).toHaveAttribute(
      'href',
      '/ru-RU/dashboard',
    );
    await userEvent.click(screen.getByRole('button', { name: ru.errors.retry }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('titles the tab in that language', () => {
    render(<GlobalErrorPage reset={vi.fn()} locale="de-DE" messages={de} />);
    expect(document.title).toBe('Etwas ist schiefgelaufen · Market Ops Console');
  });
});
