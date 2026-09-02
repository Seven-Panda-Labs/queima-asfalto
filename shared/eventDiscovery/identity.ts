import type { DiscoveredRace } from './types.js'

/**
 * The name without the edition.
 *
 * "XI Run Castle" becomes "XII Run Castle" next September, and "IV Trail Entre
 * o Dão e o Mondego" becomes "V". An id built from the raw name would give the
 * same race a new identity every year, and dedup would never match two sources
 * that write the ordinal differently.
 */
const EDITION_PREFIX = /^\s*(?:[ivxlcdm]+|\d{1,3}\.?[ºªoa]?)\s*[-–—.)]?\s+/i

/**
 * Canonical roman numerals from I to XLIX.
 *
 * Not any string of roman letters: "Mil Metros do Porto" is a thousand metres
 * and "Vila" is a town, and both would lose their first word to a looser test.
 * Editions past the forty-ninth keep their numeral, which costs one id.
 */
const ROMAN = /^(?:X{0,4})(?:IX|IV|V?I{0,3})$/i

/**
 * The edition written at the end instead of the front.
 *
 * Real data: "Correr pela Europa - 9ª Edição". Next year it is the tenth, and
 * an id built from the raw name would file it as a different race. A trailing
 * year does the same damage, so it goes too.
 */
const EDITION_SUFFIX =
  /\s*[-–—,]?\s*(?:\d{1,3}\s*(?:[ºªoa]|th|st|nd|rd)?\s*(?:edi[çc][ãa]o|edition|ed\.?)|(?:19|20)\d{2})\s*$/i

export function stripEdition(name: string): string {
  const withoutSuffix = name.replace(EDITION_SUFFIX, '').trim()
  if (withoutSuffix && withoutSuffix !== name.trim()) return stripEdition(withoutSuffix)

  const match = EDITION_PREFIX.exec(name)
  if (!match) return name.trim()

  const prefix = match[0].trim().replace(/[-–—.)]+$/, '').trim()
  const rest = name.slice(match[0].length).trim()
  if (!rest) return name.trim()
  // A leading number is an edition; a leading word is only an edition when it
  // reads as a roman numeral.
  if (/^\d/.test(prefix) || ROMAN.test(prefix)) return rest
  return name.trim()
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * What makes two listings the same race.
 *
 * Name without its edition, plus the day, plus the country. The day rather than
 * the year because two sources disagree about a race's name far more often than
 * about when it starts, and a race that moves by a day is a different edition
 * nobody wants merged with the old one.
 */
export function raceKey(race: DiscoveredRace): string {
  const day = race.startDate.slice(0, 10)
  return [slugify(stripEdition(race.name)), day, race.country ?? '??'].join('|')
}

/**
 * The catalog id for a race, stable across editions.
 *
 * `races.catalogRaceId` points at it and no Firestore rule can check for
 * references, so this string is a promise: same race, same id, next year too.
 */
export function catalogId(race: DiscoveredRace): string {
  const parts = [
    (race.country ?? 'xx').toLowerCase(),
    slugify(race.city ?? ''),
    slugify(stripEdition(race.name)),
  ].filter(Boolean)
  return parts.join('-')
}
