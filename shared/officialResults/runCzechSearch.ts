import type { UserResultsProfile } from './types.js'

export function buildRunCzechSearchTerm(profile: UserResultsProfile): string | null {
  const first = profile.resultFirstName?.trim()
  const last = profile.resultLastName?.trim()

  if (first && last) return `${first} ${last}`
  if (last && last.length >= 2) return last
  if (first && first.length >= 2) return first

  return null
}
