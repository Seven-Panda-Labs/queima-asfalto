import i18n from '../i18n'
import { resolveIntlLocale } from '../i18n/locale'

function getIntlLocale(): string {
  return resolveIntlLocale(i18n.language)
}

export function formatDatePt(date: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const PT_DATE_INPUT = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export function formatDatePtInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function parseDatePtInput(value: string): Date | null {
  const match = PT_DATE_INPUT.exec(value.trim())
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function formatRelativeTimePt(date: Date): string {
  const now = new Date()
  const diffMs = startOfDay(now).getTime() - startOfDay(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return i18n.t('relativeTime.today')
  if (diffDays === 1) return i18n.t('relativeTime.oneDayAgo')
  if (diffDays < 30) return i18n.t('relativeTime.daysAgo', { count: diffDays })

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return i18n.t('relativeTime.oneMonthAgo')
  if (diffMonths < 12) return i18n.t('relativeTime.monthsAgo', { count: diffMonths })

  const diffYears = Math.floor(diffDays / 365)
  if (diffYears === 1) return i18n.t('relativeTime.oneYearAgo')
  return i18n.t('relativeTime.yearsAgo', { count: diffYears })
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime()
}

export function isPastDate(date: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime()
}

export function isFutureDate(date: Date): boolean {
  return startOfDay(date).getTime() > startOfDay(new Date()).getTime()
}

export function isTodayOrFuture(date: Date): boolean {
  return !isPastDate(date)
}

export function getYear(date: Date): number {
  return date.getFullYear()
}
