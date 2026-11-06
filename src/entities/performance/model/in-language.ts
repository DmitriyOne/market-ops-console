import type { Dataset } from '@/shared/api';

/** Region and market names by id, from the messages (`places`). */
export type PlaceNames = {
  regions: Readonly<Record<string, string>>;
  markets: Readonly<Record<string, string>>;
};

/**
 * The dataset with region and market names in the page's language. Ids,
 * ISO codes and numbers stay as they are; a name the messages lack keeps
 * the dataset's (English) one. Product names are brands and stay.
 */
export function inLanguage(ds: Dataset, names: PlaceNames): Dataset {
  return {
    ...ds,
    regions: ds.regions.map((r) => ({ ...r, name: names.regions[r.id] ?? r.name })),
    markets: ds.markets.map((m) => ({ ...m, name: names.markets[m.id] ?? m.name })),
  };
}
