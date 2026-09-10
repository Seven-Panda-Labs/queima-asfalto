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

import { GENERIC } from '../eventDiscovery/duplicates.js'

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
 * The words to search by, the most selective first.
 *
 * Selective means "on few entries", and only one class of word is reliably
 * not: the ones every race is called. "maratona" is on hundreds, "lisboa" on
 * a handful, and the answer is found by looking in the small pool and then
 * ranking every candidate against everything that was typed.
 *
 * A sponsor stays, and is often the best pool there is: "edp" narrows harder
 * than "lisboa" does. It was excluded while this picked a single word, because
 * a sponsor is what differs between two namings of one race, and with a pool
 * per word that reasoning no longer holds: the ranking sorts that out, and a
 * pool that misses is a pool the others cover.
 */
export function searchTokens(typed: string): string[] {
  const words = [
    ...new Set(
      normalizeToken(typed)
        .split(' ')
        .filter((word) => word.length >= MIN_LENGTH),
    ),
  ]
  if (words.length === 0) return []

  // Shortest first within each half: a short word that is not generic is
  // usually a place or a sponsor, and both are more selective than a long one.
  // Every word is returned, not just the ones worth querying: the caller
  // queries the first few and scores against all of them, and a word left out
  // of the scoring is a word that cannot tell two races apart.
  const byLength = (list: string[]) => [...list].sort((a, b) => a.length - b.length)
  return [
    ...byLength(words.filter((word) => !GENERIC.test(word))),
    ...byLength(words.filter((word) => GENERIC.test(word))),
  ]
}

/**
 * How much of what was typed this entry's words account for.
 *
 * Ranking and not filtering, because an exact match on every word is too much
 * to ask of two people naming the same race: "Berliner Firmenlauf" against
 * "Firmenlauf Berlin" agrees on one word exactly and on the other only if
 * German's adjective ending is forgiven, which is the same slack the duplicate
 * rule already gives a town.
 */
export function nameMatchScore(entryTokens: readonly string[] = [], typed: string): number {
  const words = normalizeToken(typed)
    .split(' ')
    .filter((word) => word.length >= MIN_LENGTH)
  if (words.length === 0) return 0

  return words.filter((word) =>
    entryTokens.some(
      (token) =>
        token === word ||
        (token.startsWith(word) && token.length - word.length <= 3) ||
        (word.startsWith(token) && word.length - token.length <= 3),
    ),
  ).length
}

/**
 * The candidates in the order a person would want them.
 *
 * The pools come back ordered by date, which is right for a page of races to
 * run and wrong for "which of these is mine": typing the Meia Maratona de
 * Lisboa returned Castro Marim, Parma and Vilnius, all sooner and none of them
 * it. So every candidate is ranked by how much of what was typed it accounts
 * for, and the date is only the tie-break.
 */
export function rankByName<T extends { nameTokens?: string[]; nextRaceDate?: string }>(
  candidates: readonly T[],
  typed: string,
): T[] {
  return candidates
    .map((candidate) => ({ candidate, score: nameMatchScore(candidate.nameTokens, typed) }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        (left.candidate.nextRaceDate ?? '').localeCompare(right.candidate.nextRaceDate ?? ''),
    )
    .map(({ candidate }) => candidate)
}
