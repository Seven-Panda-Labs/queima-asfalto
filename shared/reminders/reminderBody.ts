export type ReminderLocale = 'pt' | 'en'

const TITLES: Record<ReminderLocale, string> = {
  pt: 'Queima Asfalto — Lembrete',
  en: 'Queima Asfalto — Reminder',
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
    return locale === 'en' ? `${eventName} — today` : `${eventName} — hoje`
  }
  if (daysBefore === 1) {
    return locale === 'en' ? `${eventName} — tomorrow` : `${eventName} — amanhã`
  }
  return locale === 'en'
    ? `${eventName} — in ${daysBefore} days`
    : `${eventName} — daqui a ${daysBefore} dias`
}

export function parseReminderLocale(value: unknown): ReminderLocale {
  return value === 'en' ? 'en' : 'pt'
}
