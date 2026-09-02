export type ReminderLocale = 'pt' | 'en' | 'es' | 'de' | 'fr' | 'ar'

const TITLES: Record<ReminderLocale, string> = {
  pt: 'Queima Asfalto: Lembrete',
  en: 'Queima Asfalto: Reminder',
  es: 'Queima Asfalto: Recordatorio',
  de: 'Queima Asfalto: Erinnerung',
  fr: 'Queima Asfalto: Rappel',
  ar: 'Queima Asfalto: تذكير',
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
    if (locale === 'en') return `${eventName}, today`
    if (locale === 'es') return `${eventName}, hoy`
    if (locale === 'de') return `${eventName}, heute`
    if (locale === 'fr') return `${eventName}, aujourd'hui`
    if (locale === 'ar') return `${eventName}، اليوم`
    return `${eventName}, hoje`
  }
  if (daysBefore === 1) {
    if (locale === 'en') return `${eventName}, tomorrow`
    if (locale === 'es') return `${eventName}, mañana`
    if (locale === 'de') return `${eventName}, morgen`
    if (locale === 'fr') return `${eventName}, demain`
    if (locale === 'ar') return `${eventName}، غدًا`
    return `${eventName}, amanhã`
  }
  if (locale === 'en') return `${eventName}, in ${daysBefore} days`
  if (locale === 'es') return `${eventName}, en ${daysBefore} días`
  if (locale === 'de') return `${eventName}, in ${daysBefore} Tagen`
  if (locale === 'fr') return `${eventName}, dans ${daysBefore} jours`
  if (locale === 'ar') return `${eventName}، بعد ${daysBefore} أيام`
  return `${eventName}, daqui a ${daysBefore} dias`
}

export function parseReminderLocale(value: unknown): ReminderLocale {
  if (value === 'en' || value === 'es' || value === 'de' || value === 'fr' || value === 'ar') return value
  if (value === 'pt') return 'pt'
  return 'en'
}

/**
 * What a deadline notification says.
 *
 * The race name, then the gate, then when. Built from parts rather than a
 * sentence per case, because four gates times three day shapes times six
 * languages is 72 sentences nobody would keep true.
 */
const DEADLINE_PHRASES: Record<
  ReminderLocale,
  Record<'place_confirm' | 'registration_closes' | 'lottery_draw' | 'registration_opens', string>
> = {
  pt: {
    place_confirm: 'garante o teu lugar',
    registration_closes: 'as inscrições fecham',
    lottery_draw: 'sorteio',
    registration_opens: 'as inscrições abrem',
  },
  en: {
    place_confirm: 'secure your place',
    registration_closes: 'registration closes',
    lottery_draw: 'lottery draw',
    registration_opens: 'registration opens',
  },
  es: {
    place_confirm: 'asegura tu plaza',
    registration_closes: 'las inscripciones cierran',
    lottery_draw: 'sorteo',
    registration_opens: 'las inscripciones abren',
  },
  de: {
    place_confirm: 'sichere deinen Platz',
    registration_closes: 'die Anmeldung schließt',
    lottery_draw: 'Ziehung',
    registration_opens: 'die Anmeldung öffnet',
  },
  fr: {
    place_confirm: 'sécurise ta place',
    registration_closes: 'les inscriptions ferment',
    lottery_draw: 'tirage au sort',
    registration_opens: 'les inscriptions ouvrent',
  },
  ar: {
    place_confirm: 'ثبّت مكانك',
    registration_closes: 'يغلق التسجيل',
    lottery_draw: 'القرعة',
    registration_opens: 'يفتح التسجيل',
  },
}

const WHEN: Record<ReminderLocale, { today: string; tomorrow: string; days: (n: number) => string }> = {
  pt: { today: 'hoje', tomorrow: 'amanhã', days: (n) => `daqui a ${n} dias` },
  en: { today: 'today', tomorrow: 'tomorrow', days: (n) => `in ${n} days` },
  es: { today: 'hoy', tomorrow: 'mañana', days: (n) => `en ${n} días` },
  de: { today: 'heute', tomorrow: 'morgen', days: (n) => `in ${n} Tagen` },
  fr: { today: "aujourd'hui", tomorrow: 'demain', days: (n) => `dans ${n} jours` },
  ar: { today: 'اليوم', tomorrow: 'غدًا', days: (n) => `بعد ${n} أيام` },
}

export function formatDeadlineBody(
  raceName: string,
  kind: keyof (typeof DEADLINE_PHRASES)['en'],
  daysBefore: number,
  locale: ReminderLocale,
  localTime?: string,
): string {
  const when = WHEN[locale]
  const timing =
    daysBefore === 0 ? when.today : daysBefore === 1 ? when.tomorrow : when.days(daysBefore)
  const phrase = DEADLINE_PHRASES[locale][kind]
  // The hour only helps on the day itself, and only when the organiser published
  // one: "opens today at 11:00 JST" is worth saying, "opens in 30 days at 11:00"
  // is noise.
  const suffix = daysBefore === 0 && localTime ? ` ${localTime}` : ''
  return `${raceName}: ${phrase} ${timing}${suffix}`
}
