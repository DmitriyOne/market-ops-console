/** Total time for a JSON request (`/api/v1/data`, `/api/v1/alerts`). */
export const REQUEST_TIMEOUT_MS = 8000;
/** Time from sending a chat question to its first SSE event. */
export const STREAM_FIRST_EVENT_TIMEOUT_MS = 10000;
/** Longest allowed gap between two SSE events. No total cap. */
export const STREAM_IDLE_TIMEOUT_MS = 15000;
