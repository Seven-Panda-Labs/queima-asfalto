import i18n from '../i18n'

const TIME_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})$/

export function normalizeTime(input: string): string | null {
  const match = TIME_PATTERN.exec(input.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])

  if (minutes > 59 || seconds > 59) return null

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}

export function validateTime(input: string): boolean {
  return normalizeTime(input) !== null
}

export function parseTime(input: string): number | null {
  const normalized = normalizeTime(input)
  if (!normalized) return null

  const [hours, minutes, seconds] = normalized.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

export function joinTime(hours: string, minutes: string, seconds: string): string {
  const h = hours.trim() === '' ? '0' : hours.trim()
  const m = minutes.trim() === '' ? '0' : minutes.trim()
  const s = seconds.trim() === '' ? '0' : seconds.trim()
  return `${h}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`
}

export function splitTime(input: string): { hours: string; minutes: string; seconds: string } {
  const normalized = normalizeTime(input)
  if (!normalized) return { hours: '', minutes: '', seconds: '' }
  const [hours, minutes, seconds] = normalized.split(':')
  return { hours, minutes, seconds }
}

export function getInvalidTimeMessage(): string {
  return i18n.t('validation.invalidTimeFormat')
}

/** @deprecated Use getInvalidTimeMessage() */
export const INVALID_TIME_MESSAGE = 'Tempo inválido. Usa o formato hh:mm:ss'
