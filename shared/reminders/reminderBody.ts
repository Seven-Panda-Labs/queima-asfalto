export type ReminderLocale = 'pt' | 'en' | 'es' | 'de'

const TITLES: Record<ReminderLocale, string> = {
  pt: 'Queima Asfalto — Lembrete',
  en: 'Queima Asfalto — Reminder',
  es: 'Queima Asfalto — Recordatorio',
  de: 'Queima Asfalto — Erinnerung',
}

export function formatReminderTitle(locale: ReminderLocale): string {
  return TITLES[locale]
}

export function formatReminderBody(
  eventName: string,
  daysBefore: number,
  locale: ReminderLocale,
): string {
  if (daysBefore === 0) {
    if (locale === 'en') return `${eventName} — today`
    if (locale === 'es') return `${eventName} — hoy`
    if (locale === 'de') return `${eventName} — heute`
    return `${eventName} — hoje`
  }
  if (daysBefore === 1) {
    if (locale === 'en') return `${eventName} — tomorrow`
    if (locale === 'es') return `${eventName} — mañana`
    if (locale === 'de') return `${eventName} — morgen`
    return `${eventName} — amanhã`
  }
  if (locale === 'en') return `${eventName} — in ${daysBefore} days`
  if (locale === 'es') return `${eventName} — en ${daysBefore} días`
  if (locale === 'de') return `${eventName} — in ${daysBefore} Tagen`
  return `${eventName} — daqui a ${daysBefore} dias`
}

export function parseReminderLocale(value: unknown): ReminderLocale {
  if (value === 'en' || value === 'es' || value === 'de') return value
  if (value === 'pt') return 'pt'
  return 'en'
}
