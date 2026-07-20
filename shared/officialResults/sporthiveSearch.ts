import type { UserResultsProfile } from './types.js'

/** Sporthive name search term — prefer full name, then last name (like the website). */
export function buildSporthiveSearchTerm(profile: UserResultsProfile): string | null {
  const first = profile.resultFirstName?.trim()
  const last = profile.resultLastName?.trim()

  if (first && last) return `${first} ${last}`.toLowerCase()
  if (last && last.length >= 2) return last.toLowerCase()
  if (first && first.length >= 2) return first.toLowerCase()

  return null
}
