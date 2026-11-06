// Sentry in the browser (ADR 0019). Options shared with the server and edge.
import * as Sentry from '@sentry/nextjs';

import { sentryOptions } from '@/shared/config/sentry';

Sentry.init(sentryOptions());

// Navigations as traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
