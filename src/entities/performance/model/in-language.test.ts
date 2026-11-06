import { describe, expect, it } from 'vitest';

import { deMessages, enMessages, ruMessages } from '@/shared/config';

import { inLanguage } from './in-language';
import { ds as dataset } from './test-dataset';

describe('inLanguage', () => {
  it('names regions and markets in the language; ids, codes and numbers stay', () => {
    const ru = inLanguage(dataset, ruMessages.places);
    expect(ru.regions.map((r) => r.name)).toEqual([
      'Северная Америка',
      'Европа',
      'АТР',
      'Латинская Америка',
    ]);
    const germany = ru.markets.find((m) => m.id === 'de');
    expect(germany).toMatchObject({ name: 'Германия', iso2: 'DE', iso3: 'DEU' });
    expect(germany?.kpis).toEqual(dataset.markets.find((m) => m.id === 'de')?.kpis);
    expect(ru.series).toBe(dataset.series);
    expect(ru.products).toBe(dataset.products);
  });

  it('every locale names every region and market of the dataset; English as the data has it', () => {
    for (const messages of [enMessages, deMessages, ruMessages]) {
      const named = inLanguage(dataset, messages.places);
      for (const r of dataset.regions) expect(messages.places.regions).toHaveProperty(r.id);
      for (const m of dataset.markets) expect(messages.places.markets).toHaveProperty(m.id);
      expect(named.markets).toHaveLength(dataset.markets.length);
    }
    expect(inLanguage(dataset, enMessages.places)).toEqual(dataset);
  });

  it('a name the messages lack keeps the data one', () => {
    expect(inLanguage(dataset, { regions: {}, markets: {} }).markets[0]?.name).toBe(
      dataset.markets[0]?.name,
    );
  });
});
