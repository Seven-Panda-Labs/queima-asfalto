import type { UserResultsProfile } from './types.js'

function normalizeNamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: '', last: parts[0]! }
  return { first: parts[0]!, last: parts.slice(1).join(' ') }
}

export function namesMatch(
  profile: UserResultsProfile,
  candidateFirst: string,
  candidateLast: string,
): boolean {
  const profileFirst = normalizeNamePart(profile.resultFirstName ?? '')
  const profileLast = normalizeNamePart(profile.resultLastName ?? '')
  const first = normalizeNamePart(candidateFirst)
  const last = normalizeNamePart(candidateLast)

  if (!profileFirst && !profileLast) return false

  const lastMatches = !profileLast || last.includes(profileLast) || profileLast.includes(last)
  const firstMatches = !profileFirst || first.includes(profileFirst) || profileFirst.includes(first)

  return lastMatches && firstMatches
}

export function namesMatchFullName(profile: UserResultsProfile, fullName: string): boolean {
  const { first, last } = splitFullName(fullName)
  return namesMatch(profile, first, last)
}

export function matchesResultsProfile(profile: UserResultsProfile, fullName: string): boolean {
  if (namesMatchFullName(profile, fullName)) return true

  const normalizedCandidate = normalizeNamePart(fullName)
  if (!normalizedCandidate) return false

  for (const alias of profile.resultNameAliases ?? []) {
    const normalizedAlias = normalizeNamePart(alias)
    if (!normalizedAlias) continue
    if (
      normalizedCandidate === normalizedAlias ||
      normalizedCandidate.includes(normalizedAlias) ||
      normalizedAlias.includes(normalizedCandidate)
    ) {
      return true
    }
  }

  return false
}

export function formatProfileName(profile: UserResultsProfile): string {
  return [profile.resultFirstName?.trim(), profile.resultLastName?.trim()].filter(Boolean).join(' ')
}
