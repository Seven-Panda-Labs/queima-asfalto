/**
 * The words a catalog entry can be found by.
 *
 * Firestore has no substring search and no index over a string's middle, so
 * "find me the Berliner Halbmarathon" cannot be a query at all unless the
 * words are stored as a list. `array-contains` over this is indexed; a
 * `>=`/`<=` pair on the name would only ever match a prefix, and the name a
 * runner remembers is hardly ever the start of the one a source published:
 * "GENERALI BERLINER HALBMARATHON" begins with a sponsor.
 *
 * What the search could do before this was filter the page it had already
 * fetched, which at twenty rows out of five thousand entries meant a race was
 * findable only if it happened to be among the next few worldwide.
 *
 * The city goes in beside the name because that is what the field asked for
 * and what a person types: "berlin" should find both the races in Berlin and
 * the ones called Berlin something.
 */

import { GENERIC, isNoiseWord } from '../eventDiscovery/duplicates.js'

/** Anything shorter is noise: "5k", "de", "am", and every roman numeral. */
const MIN_LENGTH = 3

/**
 * Firestore indexes every element, so a long name is a long index entry. Ten
 * words is more than any real name needs, and the words a person searches for
 * come first anyway.
 */
const MAX_TOKENS = 12

/** Lower case, no accents, and nothing that is not a letter or a digit. */
export function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function nameTokensOf(name: string, city = ''): string[] {
  const words = normalizeToken(`${name} ${city}`).split(' ')
  const tokens = new Set<string>()
  for (const word of words) {
    if (word.length < MIN_LENGTH) continue
    tokens.add(word)
    if (tokens.size >= MAX_TOKENS) break
  }
  return [...tokens]
}

/**
 * The one word to ask the server for, out of everything the runner typed.
 *
 * Firestore takes a single `array-contains` per query, so a search for
 * "teltowkanal halbmarathon" has to pick one word and let the rest narrow the
 * page that comes back. The pick is the word that is not on every second race:
 * "halbmarathon" is on hundreds of entries and "teltowkanal" on one, and it is
 * the longer of the two, which is why length alone is the wrong test.
 *
 * A sponsor is skipped for the same reason, and it matters more than it
 * sounds: "Generali Berliner Halbmarathon" has two words that are not generic,
 * and the sponsor is the one that differs between the name a runner kept and
 * the one the source published.
 *
 * The longest is the tie-break among words that are all distinctive, and the
 * fallback when every word typed is generic or a sponsor.
 */
export function searchToken(typed: string): string | undefined {
  const words = normalizeToken(typed)
    .split(' ')
    .filter((word) => word.length >= MIN_LENGTH)
  if (words.length === 0) return undefined

  const distinctive = words.filter((word) => !GENERIC.test(word) && !isNoiseWord(word))
  const longest = (list: string[]) =>
    list.reduce((best, word) => (word.length > best.length ? word : best))
  return longest(distinctive.length > 0 ? distinctive : words)
}
