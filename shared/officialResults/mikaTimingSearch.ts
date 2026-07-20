import type { UserResultsProfile } from './types.js'

/** mika:timing search API — usually last name in `search[name]`. */
export function buildMikaTimingSearchTerm(profile: UserResultsProfile): string | null {
  const last = profile.resultLastName?.trim()
  if (last && last.length >= 2) return last

  const first = profile.resultFirstName?.trim()
  if (first && first.length >= 2) return first

  return null
}
