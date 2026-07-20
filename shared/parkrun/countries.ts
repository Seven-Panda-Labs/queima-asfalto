/** parkrun internal country codes → ISO 3166-1 alpha-2 */
export const PARKRUN_COUNTRY_ISO: Record<number, string> = {
  3: 'AU',
  4: 'AT',
  14: 'CA',
  23: 'DK',
  30: 'FI',
  32: 'DE',
  42: 'IE',
  44: 'IT',
  46: 'JP',
  54: 'LT',
  57: 'MY',
  64: 'NL',
  65: 'NZ',
  67: 'NO',
  74: 'PL',
  82: 'SG',
  85: 'ZA',
  88: 'SE',
  97: 'GB',
  98: 'US',
}

const displayNamesCache = new Map<string, Intl.DisplayNames>()

function regionDisplayNames(locale: string): Intl.DisplayNames {
  const key = locale.split('-')[0] ?? locale
  let names = displayNamesCache.get(key)
  if (!names) {
    names = new Intl.DisplayNames([key], { type: 'region' })
    displayNamesCache.set(key, names)
  }
  return names
}

export function parkrunCountryName(countryCode: number, locale = 'en'): string {
  const iso = PARKRUN_COUNTRY_ISO[countryCode]
  if (!iso) return ''
  return regionDisplayNames(locale).of(iso) ?? iso
}

export function formatParkrunEventSubtitle(
  location: string,
  countryCode: number,
  locale = 'en',
): string {
  const country = parkrunCountryName(countryCode, locale)
  if (!location.trim()) return country
  if (!country) return location.trim()
  return `${location.trim()} · ${country}`
}
