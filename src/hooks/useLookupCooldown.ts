import { useCallback, useEffect, useState } from 'react'
import {
  OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS,
  officialResultsLookupCooldownSeconds,
} from '../../shared/officialResults'

export function useLookupCooldown(
  cooldownMs = OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS,
): {
  remainingSeconds: number
  isCoolingDown: boolean
  startCooldown: (durationMs?: number) => void
} {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const startCooldown = useCallback(
    (durationMs = cooldownMs) => {
      setEndsAt(Date.now() + durationMs)
    },
    [cooldownMs],
  )

  useEffect(() => {
    if (endsAt == null) {
      setRemainingSeconds(0)
      return
    }

    const tick = () => {
      const remainingMs = Math.max(0, endsAt - Date.now())
      const seconds = remainingMs > 0 ? officialResultsLookupCooldownSeconds(remainingMs) : 0
      setRemainingSeconds(seconds)
      if (seconds === 0) {
        setEndsAt(null)
      }
    }

    tick()
    const intervalId = window.setInterval(tick, 250)
    return () => window.clearInterval(intervalId)
  }, [endsAt])

  return {
    remainingSeconds,
    isCoolingDown: remainingSeconds > 0,
    startCooldown,
  }
}

function readRetryAfterMs(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('details' in error)) return undefined
  const details = (error as { details?: unknown }).details
  if (!details || typeof details !== 'object' || !('retryAfterMs' in details)) return undefined
  const retryAfterMs = (details as { retryAfterMs?: unknown }).retryAfterMs
  return typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs) ? retryAfterMs : undefined
}

export function startLookupCooldownFromError(
  error: unknown,
  startCooldown: (durationMs?: number) => void,
  fallbackMs = OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS,
): void {
  const retryAfterMs = readRetryAfterMs(error)
  startCooldown(retryAfterMs ?? fallbackMs)
}
