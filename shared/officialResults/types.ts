import { isCompleteParkrunnerId } from './parkrunnerId.js'

export type ResultsPlatform =
  | 'parkrun'
  | 'davengo'
  | 'sporthive'
  | 'myraceresult'
  | 'sccevents'
  | 'maxfunsports'
  | 'myracepartner'
  | 'strassenlauf'
  | 'zielzeit'
  | 'eqtiming'
  | 'nsfberlin'
  | 'runczech'
  | 'ultimate'
  | 'vcrunning'
  | 'wiclax'
  | 'timataka'
  | 'mikatiming'

export const RESULTS_PLATFORMS: ResultsPlatform[] = [
  'parkrun',
  'davengo',
  'sporthive',
  'myraceresult',
  'sccevents',
  'maxfunsports',
  'myracepartner',
  'strassenlauf',
  'zielzeit',
  'eqtiming',
  'nsfberlin',
  'runczech',
  'ultimate',
  'vcrunning',
  'wiclax',
  'timataka',
  'mikatiming',
]

export function resultsPlatformLabel(platform: ResultsPlatform): string {
  if (platform === 'parkrun') return 'Parkrun'
  if (platform === 'davengo') return 'Davengo'
  if (platform === 'sporthive') return 'Sporthive'
  if (platform === 'myraceresult') return 'MyRaceResult'
  if (platform === 'sccevents') return 'SCC Events'
  if (platform === 'maxfunsports') return 'MaxFunSports'
  if (platform === 'myracepartner') return 'MyRacePartner'
  if (platform === 'strassenlauf') return 'Strassenlauf.org'
  if (platform === 'zielzeit') return 'ZielZeit'
  if (platform === 'eqtiming') return 'EQ Timing'
  if (platform === 'nsfberlin') return 'NSF Berlin'
  if (platform === 'runczech') return 'RunCzech'
  if (platform === 'ultimate') return 'Ultimate Sport Service'
  if (platform === 'vcrunning') return 'VCRunning'
  if (platform === 'wiclax') return 'Wiclax'
  if (platform === 'timataka') return 'Tímataka'
  if (platform === 'mikatiming') return 'mika:timing'
  return platform
}

export function getSortedResultsPlatforms(): ResultsPlatform[] {
  return [...RESULTS_PLATFORMS].sort((left, right) =>
    resultsPlatformLabel(left).localeCompare(resultsPlatformLabel(right), 'en'),
  )
}

export type OfficialResultCandidate = {
  platform: ResultsPlatform
  matchedName: string
  time: string
  position?: number
  totalParticipants?: number
  sourceUrl: string
  confidence: 'high' | 'medium' | 'low'
}

export type UserResultsProfile = {
  resultFirstName?: string
  resultLastName?: string
  resultNameAliases?: string[]
  parkrunnerId?: string
  favoriteParkrunSlugs?: string[]
}

export const PARKRUN_BASE_URL = 'https://www.parkrun.com.de'

export function isParkrunEventName(name: string): boolean {
  return /park\s*run/i.test(name)
}

export function hasResultsName(profile: UserResultsProfile): boolean {
  return Boolean(profile.resultFirstName?.trim() || profile.resultLastName?.trim())
}

export function canLookupParkrun(profile: UserResultsProfile): boolean {
  return isCompleteParkrunnerId(profile.parkrunnerId ?? '')
}

export function canLookupPlatform(
  platform: ResultsPlatform,
  profile: UserResultsProfile,
  resultsUrl?: string,
): boolean {
  if (platform === 'parkrun') return canLookupParkrun(profile)
  return hasResultsName(profile) && Boolean(resultsUrl?.trim())
}
