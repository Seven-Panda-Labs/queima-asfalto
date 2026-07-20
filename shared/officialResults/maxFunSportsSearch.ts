import type { UserResultsProfile } from './types.js'

/** MaxFunSports table filter — usually last name. */
export function buildMaxFunSportsSearchTerm(profile: UserResultsProfile): string | null {
  const last = profile.resultLastName?.trim()
  if (last && last.length >= 2) return last

  const first = profile.resultFirstName?.trim()
  if (first && first.length >= 2) return first

  return null
}
