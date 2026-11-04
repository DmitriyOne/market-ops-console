/**
 * The single place product events (e.g. answer feedback) are recorded, so an
 * analytics or RUM service can be plugged in later. Console only for now.
 */
export function logEvent(name: string, data: Record<string, unknown>): void {
  console.info(`[event] ${name}`, data);
}
