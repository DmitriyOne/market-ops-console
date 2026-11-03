import 'server-only';

import raw from '@/data/fixtures.json';

import { parseSourceData } from '../parse-source-data';
import { type Fixtures, fixturesSchema } from './contract';

let cached: Fixtures | undefined;

/** The validated assistant fixtures, parsed once per server process. Throws DataIntegrityError. */
export function loadFixtures(): Fixtures {
  cached ??= parseSourceData(fixturesSchema, raw, 'fixtures.json');
  return cached;
}
