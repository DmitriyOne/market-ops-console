import 'server-only';

import raw from '@/data/data.json';

import { parseSourceData } from '../parse-source-data';
import { type Dataset, datasetSchema } from './schema';

let cached: Dataset | undefined;

/** The validated dataset, parsed once per server process. Throws DataIntegrityError. */
export function loadDataset(): Dataset {
  cached ??= parseSourceData(datasetSchema, raw, 'data.json');
  return cached;
}
