import { beforeEach, describe, expect, it, vi } from 'vitest';

import de from './messages/de.json';
import en from './messages/en.json';

const rootLocale = vi.hoisted(() => ({ value: 'en-GB' }));
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
);

vi.mock('next/root-params', () => ({ locale: () => Promise.resolve(rootLocale.value) }));
vi.mock('next/navigation', () => ({ notFound }));
async function resolve() {
  const { resolveRequestConfig } = await import('./request');
  return resolveRequestConfig();
}

describe('request config', () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it('uses the locale from the URL with its messages', async () => {
    rootLocale.value = 'de-DE';
    await expect(resolve()).resolves.toMatchObject({ locale: 'de-DE', messages: de });
  });

  it('serves en messages for en-US', async () => {
    rootLocale.value = 'en-US';
    await expect(resolve()).resolves.toMatchObject({ locale: 'en-US', messages: en });
  });

  it('calls notFound for an unknown locale', async () => {
    rootLocale.value = 'xx';
    await expect(resolve()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
