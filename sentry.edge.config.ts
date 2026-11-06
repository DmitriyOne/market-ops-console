// Sentry in the edge runtime, loaded by instrumentation.ts (ADR 0019). Nothing
// runs on edge today (the Next 16 proxy runs on Node.js); kept as the docs lay
// it out, so a future edge route is covered.
import * as Sentry from '@sentry/nextjs';

import { sentryOptions } from '@/shared/config/sentry';

Sentry.init(sentryOptions());
