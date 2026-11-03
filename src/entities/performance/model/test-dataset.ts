import raw from '@/data/data.json';
import { datasetSchema } from '@/shared/api';

/** The real dataset, validated — shared by this slice's tests. */
export const ds = datasetSchema.parse(raw);
