/** A signal that aborts when the caller aborts or after `timeoutMs` (reason: `TimeoutError`). */
export function createRequestSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
