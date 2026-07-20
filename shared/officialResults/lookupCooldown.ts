export const OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS = 10_000

export function officialResultsLookupRemainingMs(
  lastLookupAt: number,
  now = Date.now(),
  cooldownMs = OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS,
): number {
  return Math.max(0, cooldownMs - (now - lastLookupAt))
}

export function officialResultsLookupCooldownSeconds(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / 1000))
}
