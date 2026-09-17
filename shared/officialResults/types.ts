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

/**
 * Platforms whose site turns away every automated reader, so the button could
 * only ever return an error. MaxFunSports serves the results table behind a
 * Cloudflare challenge and its iframe host disallows all crawling; Parkrun
 * answers 403 to anything that is not a browser.
 */
export const LOOKUP_UNAVAILABLE_PLATFORMS: ResultsPlatform[] = ['parkrun', 'maxfunsports']

export function isLookupUnavailable(platform: ResultsPlatform): boolean {
  return LOOKUP_UNAVAILABLE_PLATFORMS.includes(platform)
}

/**
 * Platforms whose official results PDF the app can read from a file the runner
 * saved. The upload is the way in where the site itself refuses to be read.
 */
export const RESULTS_PDF_PLATFORMS: ResultsPlatform[] = ['maxfunsports']

export function acceptsResultsPdf(platform: ResultsPlatform): boolean {
  return RESULTS_PDF_PLATFORMS.includes(platform)
}

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

/**
 * What settings lists. RESULTS_PLATFORMS stays whole for reading back a
 * backup, but naming a platform the search can no longer reach only promises
 * something the button will not do.
 */
export function getSupportedLookupPlatforms(): ResultsPlatform[] {
  return RESULTS_PLATFORMS.filter((platform) => !isLookupUnavailable(platform)).sort(
    (left, right) => resultsPlatformLabel(left).localeCompare(resultsPlatformLabel(right), 'en'),
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
