/**
 * The DSN of the E2E build (ADR 0019): a valid shape on a port nothing
 * listens on, so even an event that slipped past the fixtures could not
 * leave the machine.
 */
export const E2E_SENTRY_DSN = 'http://public@127.0.0.1:9/0';
