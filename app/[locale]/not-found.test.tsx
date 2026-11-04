import { render, screen } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { enMessages as en } from '@/shared/config';

import NotFound from './not-found';

vi.mock('next-intl/server', () => ({
  getTranslations: (namespace: 'notFound' | 'common') =>
    Promise.resolve(createTranslator({ locale: 'en-GB', messages: en, namespace })),
}));
vi.mock('@/shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/config')>()),
  Link: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}));

describe('not-found page', () => {
  it('has a skip link to its main landmark', async () => {
    render(await NotFound());
    expect(screen.getByRole('link', { name: en.common.skipToContent })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument();
  });
});
