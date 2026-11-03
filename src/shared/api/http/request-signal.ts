import { TIMEOUT_REASON_NAME } from './errors';

export function timeoutReason(): DOMException {
  return new DOMException('The request timed out', TIMEOUT_REASON_NAME);
}

/**
 * A signal that aborts when the caller aborts or after `timeoutMs`.
 * Uses setTimeout rather than AbortSignal.timeout so the timer follows the
 * test clock; the reason is a `TimeoutError` DOMException either way.
 */
export function createRequestSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeout = new AbortController();
  const timer = setTimeout(() => {
    timeout.abort(timeoutReason());
  }, timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  combined.addEventListener(
    'abort',
    () => {
      clearTimeout(timer);
    },
    { once: true },
  );
  return combined;
}
