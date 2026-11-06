/** What happens to a logged error in Sentry (ADR 0019). */
export type ReportLevel = 'skip' | 'warning' | 'error';

/**
 * Answers the user caused (a name already taken, too many rules, a rule
 * someone else deleted, the "Fail the next save" demo switch): the UI
 * explains them, they are not faults.
 */
const EXPECTED_HTTP_CODES = new Set(['duplicate_name', 'too_many', 'not_found', 'simulated']);

/**
 * The codes our route handlers answer a server fault with
 * (`withErrorHandling`): the server reported the real exception already, so
 * the browser's copy (no cause, no stack of its own) would be a duplicate.
 * A 5xx without one of them (a gateway, a crashed function) the server never
 * saw: that one is reported.
 */
const SERVER_REPORTED_CODES = new Set(['internal', 'data_integrity']);

function field(error: unknown, key: string): unknown {
  if (typeof error !== 'object' || error === null || !(key in error)) return undefined;
  return Reflect.get(error, key);
}

/**
 * Decides whether a logged error is a fault worth an issue. Read by shape,
 * not `instanceof`: the API errors live in `shared/api`, which imports this
 * layer, and a server error reaches the browser as a plain copy.
 *
 * - `skip`: an expected 4xx `AppError` (the server answers it, ADR 0013);
 *   an expected client `HttpError` code; a 5xx with our own server-fault code
 *   (the server reported it); a user abort; and an error with a `digest` (a
 *   server error Next already reported through `onRequestError`; the browser
 *   only holds a stripped copy). Kept as a breadcrumb.
 * - `warning`: offline or timed out (the user's network, not the app); a
 *   chunk a newer deploy removed (`ChunkLoadError`).
 * - `error`: everything else, including a 400 our own form caused.
 */
export function reportLevel(error: unknown): ReportLevel {
  if (field(error, 'expose') === true) return 'skip';
  if (typeof field(error, 'digest') === 'string') return 'skip';
  const name = field(error, 'name');
  if (name === 'AbortedError') return 'skip';
  if (name === 'NetworkError' || name === 'TimeoutError') return 'warning';
  if (name === 'HttpError') {
    const code = field(error, 'code');
    if (typeof code === 'string' && EXPECTED_HTTP_CODES.has(code)) return 'skip';
    if (typeof code === 'string' && SERVER_REPORTED_CODES.has(code)) return 'skip';
  }
  // A stale tab asking for a chunk the last deploy removed: not a fault in the code.
  if (name === 'ChunkLoadError') return 'warning';
  return 'error';
}
