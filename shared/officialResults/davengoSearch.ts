import type { UserResultsProfile } from './types.js'

/** Davengo simple search term — mirrors the website name filter (usually last name). */
export function buildDavengoSearchTerm(profile: UserResultsProfile): string | null {
  const last = profile.resultLastName?.trim()
  if (last && last.length >= 2) return last

  const first = profile.resultFirstName?.trim()
  if (first && first.length >= 2) return first

  return null
}
