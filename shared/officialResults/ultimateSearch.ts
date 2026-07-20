import type { UserResultsProfile } from './types.js'

export function buildUltimateSearchTerms(profile: UserResultsProfile): string[] {
  const terms = new Set<string>()
  const first = profile.resultFirstName?.trim()
  const last = profile.resultLastName?.trim()

  if (last && last.length >= 2) terms.add(last)
  if (first && last) terms.add(`${first} ${last}`)
  if (first && first.length >= 2 && !last) terms.add(first)

  for (const alias of profile.resultNameAliases ?? []) {
    const trimmed = alias.trim()
    if (trimmed.length >= 2) terms.add(trimmed)
  }

  return [...terms]
}
