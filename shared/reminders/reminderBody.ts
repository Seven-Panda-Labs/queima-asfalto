export type ReminderLocale = 'pt' | 'en' | 'es' | 'de' | 'fr' | 'ar'

const TITLES: Record<ReminderLocale, string> = {
  pt: 'Queima Asfalto — Lembrete',
  en: 'Queima Asfalto — Reminder',
  es: 'Queima Asfalto — Recordatorio',
  de: 'Queima Asfalto — Erinnerung',
  fr: 'Queima Asfalto — Rappel',
  ar: 'Queima Asfalto — تذكير',
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
    if (locale === 'fr') return `${eventName} — aujourd'hui`
    if (locale === 'ar') return `${eventName} — اليوم`
    return `${eventName} — hoje`
  }
  if (daysBefore === 1) {
    if (locale === 'en') return `${eventName} — tomorrow`
    if (locale === 'es') return `${eventName} — mañana`
    if (locale === 'de') return `${eventName} — morgen`
    if (locale === 'fr') return `${eventName} — demain`
    if (locale === 'ar') return `${eventName} — غدًا`
    return `${eventName} — amanhã`
  }
  if (locale === 'en') return `${eventName} — in ${daysBefore} days`
  if (locale === 'es') return `${eventName} — en ${daysBefore} días`
  if (locale === 'de') return `${eventName} — in ${daysBefore} Tagen`
  if (locale === 'fr') return `${eventName} — dans ${daysBefore} jours`
  if (locale === 'ar') return `${eventName} — بعد ${daysBefore} أيام`
  return `${eventName} — daqui a ${daysBefore} dias`
}

export function parseReminderLocale(value: unknown): ReminderLocale {
  if (value === 'en' || value === 'es' || value === 'de' || value === 'fr' || value === 'ar') return value
  if (value === 'pt') return 'pt'
  return 'en'
}
