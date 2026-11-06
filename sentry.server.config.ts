// Sentry on the Node.js server, loaded by instrumentation.ts (ADR 0019).
import * as Sentry from '@sentry/nextjs';

import { sentryOptions } from '@/shared/config/sentry';

Sentry.init(sentryOptions());
