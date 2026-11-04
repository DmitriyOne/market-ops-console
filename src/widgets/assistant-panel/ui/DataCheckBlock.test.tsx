import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import rawData from '@/data/data.json';
import { datasetSchema } from '@/shared/api';
import { enMessages as en, formats } from '@/shared/config';

import { buildDataCheck } from '../model/data-check';
import { DataCheckBlock } from './DataCheckBlock';

const base = datasetSchema.parse(rawData);

function renderWith(generatedAt: string) {
  const ds = { ...base, meta: { ...base.meta, generatedAt } };
  const check = buildDataCheck(ds, [{ marketId: 'de' }]);
  if (!check) throw new Error('no check');
  render(
    <NextIntlClientProvider locale="en-GB" messages={en} formats={formats} timeZone="UTC">
      <DataCheckBlock check={check} ds={ds} onHighlight={() => undefined} />
    </NextIntlClientProvider>,
  );
}

describe('DataCheckBlock', () => {
  it.each(['2026-06-09', '2026-06-09T10:00:00Z'])(
    'shows the update day for generatedAt %s',
    (generatedAt) => {
      renderWith(generatedAt);
      expect(screen.getByText(/updated 9 June 2026/)).toBeInTheDocument();
    },
  );
});
