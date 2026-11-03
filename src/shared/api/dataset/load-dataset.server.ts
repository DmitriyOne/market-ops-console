import 'server-only';

import raw from '@/data/data.json';

import { type Dataset, datasetSchema } from './schema';

let cached: Dataset | undefined;

/** The validated dataset, parsed once per server process. */
export function loadDataset(): Dataset {
  cached ??= datasetSchema.parse(raw);
  return cached;
}
