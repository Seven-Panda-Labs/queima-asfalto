import i18n from '../i18n'

/** Valores armazenados (compatível com import Excel). */
export const TARGET_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export type TargetMonth = (typeof TARGET_MONTHS)[number]

const MONTH_INDEX: Record<TargetMonth, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

export function formatTargetMonth(month?: string): string {
  if (!month) return '—'
  const trimmed = month.trim()
  if (!trimmed) return '—'
  if (!isTargetMonth(trimmed)) return trimmed
  return i18n.t(`targetMonths.${trimmed}`)
}

/** @deprecated Use formatTargetMonth */
export function formatTargetMonthPt(month?: string): string {
  return formatTargetMonth(month)
}

export function targetMonthSortIndex(month?: string): number {
  if (!month) return 13
  const index = MONTH_INDEX[month.trim() as TargetMonth]
  return index ?? 13
}

export function isTargetMonth(value: string): value is TargetMonth {
  return (TARGET_MONTHS as readonly string[]).includes(value)
}
