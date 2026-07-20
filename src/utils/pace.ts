import i18n from '../i18n'

const TIME_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})$/
const PACE_PATTERN = /^(\d{1,2}):(\d{2})$/

export function getInvalidPaceMessage(): string {
  return i18n.t('validation.invalidPaceFormat')
}

/** @deprecated Use getInvalidPaceMessage() */
export const INVALID_PACE_MESSAGE = 'Ritmo inválido. Usa o formato mm:ss'

export function normalizePace(input: string): string | null {
  const match = PACE_PATTERN.exec(input.trim())
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (seconds > 59) return null

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function validatePace(input: string): boolean {
  return normalizePace(input) !== null
}

export function parsePaceSeconds(input: string): number | null {
  const normalized = normalizePace(input)
  if (!normalized) return null

  const [minutes, seconds] = normalized.split(':').map(Number)
  return minutes * 60 + seconds
}

export function joinPace(minutes: string, seconds: string): string {
  const m = minutes.trim() === '' ? '0' : minutes.trim()
  const s = seconds.trim() === '' ? '0' : seconds.trim()
  return `${m}:${s.padStart(2, '0')}`
}

export function splitPace(input: string): { minutes: string; seconds: string } {
  const normalized = normalizePace(input)
  if (!normalized) return { minutes: '', seconds: '' }
  const [minutes, seconds] = normalized.split(':')
  return { minutes, seconds }
}

function parseTimeToSeconds(time: string): number | null {
  const match = TIME_PATTERN.exec(time.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])

  if (minutes > 59 || seconds > 59) return null

  return hours * 3600 + minutes * 60 + seconds
}

export function calculatePace(time: string, distanceKm: number): string | null {
  if (distanceKm <= 0) return null

  const totalSeconds = parseTimeToSeconds(time)
  if (totalSeconds === null || totalSeconds <= 0) return null

  const paceSeconds = Math.round(totalSeconds / distanceKm)
  const minutes = Math.floor(paceSeconds / 60)
  const seconds = paceSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
