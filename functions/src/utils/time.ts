/** Parse rank strings like "1." or "47" */
export function parseRank(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value !== 'string') return undefined
  const match = /(\d+)/.exec(value.trim())
  return match ? Number(match[1]) : undefined
}

/** Sporthive: 00:59:23.000 → 00:59:23; Parkrun 5k: 29:16 → 00:29:16 */
export function normalizeRaceTime(value: string): string | null {
  const trimmed = value.trim()
  const match = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(trimmed)
  if (!match) return normalizeParkrunTime(trimmed)
  const hours = match[1]!.padStart(2, '0')
  const minutes = match[2]!
  const seconds = match[3]!
  return `${hours}:${minutes}:${seconds}`
}

export function normalizeParkrunTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }
  const ms = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (ms) {
    return `00:${ms[1]!.padStart(2, '0')}:${ms[2]}`
  }
  return null
}

export function formatEventDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** ISO dates (±1 day) for matching calendar dates stored as local midnight in Firestore. */
export function calendarDateIsoCandidates(date: Date): string[] {
  const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const oneDayMs = 86_400_000

  return [-oneDayMs, 0, oneDayMs].map((offset) => {
    const candidate = new Date(base + offset)
    const year = candidate.getUTCFullYear()
    const month = String(candidate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(candidate.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}

export function calendarDateParkrunCandidates(isoCandidates: string[]): string[] {
  return isoCandidates.map((iso) => {
    const [year, month, day] = iso.split('-')
    return `${day}/${month}/${year}`
  })
}

export function formatEventDateParkrun(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
