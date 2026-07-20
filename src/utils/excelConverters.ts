import { normalizeTime } from './time'

const PT_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569)
  return new Date(utcDays * 86400 * 1000)
}

export function excelFractionToTime(fraction: number): string {
  const totalSeconds = Math.round(fraction * 86400)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}

export function excelFractionToPace(fraction: number): string {
  const totalSeconds = Math.round(fraction * 86400)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function isExcelFraction(value: number): boolean {
  return value > 0 && value < 1
}

export function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1000) return excelSerialToDate(value)
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    const match = PT_DATE_PATTERN.exec(trimmed)
    if (match) {
      const day = Number(match[1])
      const month = Number(match[2])
      const year = Number(match[3])
      const date = new Date(year, month - 1, day)
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date
      }
      return null
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return null
}

export function parseExcelTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = value.getUTCHours()
    const minutes = value.getUTCMinutes()
    const seconds = value.getUTCSeconds()
    if (hours === 0 && minutes === 0 && seconds === 0) return null
    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':')
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (isExcelFraction(value)) return excelFractionToTime(value)
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = normalizeTime(trimmed)
    if (normalized) return normalized
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      return normalizeTime(`00:${trimmed}`) ?? `00:${trimmed}`
    }
    return trimmed.includes(':') ? trimmed : null
  }

  return null
}

export function parseExcelPace(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (isExcelFraction(value)) return excelFractionToPace(value)
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed
    const asTime = normalizeTime(trimmed)
    if (asTime) {
      const [, minutes, seconds] = asTime.split(':').map(Number)
      return `${minutes}:${String(seconds).padStart(2, '0')}`
    }
    return null
  }

  return null
}
