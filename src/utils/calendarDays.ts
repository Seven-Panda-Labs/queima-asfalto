import i18n from '../i18n'
import { resolveIntlLocale } from '../i18n/locale'

function getIntlLocale(): string {
  return resolveIntlLocale(i18n.language)
}

/** @deprecated Use getWeekdays() for locale-aware labels */
export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/** @deprecated Use formatMonthYear() for locale-aware labels */
export const MONTH_LABEL = new Intl.DateTimeFormat('pt-PT', {
  month: 'long',
  year: 'numeric',
})

/**
 * Column headers, Monday first. Narrow, because `short` is still the whole word
 * in some locales (pt-PT «segunda», Arabic), and seven of those overlap.
 */
export function getWeekdays(): { narrow: string; long: string }[] {
  const narrow = new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'narrow' })
  const long = new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'long' })
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2024, 0, 1 + index)
    return { narrow: narrow.format(day), long: long.format(day) }
  })
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function buildCalendarDays(viewMonth: Date): Array<Date | null> {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<Date | null> = []
  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  return cells
}
