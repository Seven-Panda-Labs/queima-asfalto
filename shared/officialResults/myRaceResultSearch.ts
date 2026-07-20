import type { UserResultsProfile } from './types.js'

/** MyRaceResult search term — mirrors the website name filter (usually last name). */
export function buildMyRaceResultSearchTerm(profile: UserResultsProfile): string | null {
  const last = profile.resultLastName?.trim()
  if (last && last.length >= 2) return last.toLowerCase()

  const first = profile.resultFirstName?.trim()
  if (first && first.length >= 2) return first.toLowerCase()

  return null
}
