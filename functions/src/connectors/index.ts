import type { OfficialResultCandidate, ResultsPlatform, UserResultsProfile } from '../shared/types.js'
import { lookupDavengo } from './davengo.js'
import { lookupParkrun } from './parkrun.js'
import { lookupMaxFunSports } from './maxFunSports.js'
import { lookupMyRacePartner } from './myRacePartner.js'
import { lookupStrassenlauf } from './strassenlauf.js'
import { lookupZielZeit } from './zielZeit.js'
import { lookupEqTiming } from './eqTiming.js'
import { lookupNsfBerlin } from './nsfBerlin.js'
import { lookupRunCzech } from './runCzech.js'
import { lookupUltimate } from './ultimate.js'
import { lookupVcRunning } from './vcRunning.js'
import { lookupMikaTiming } from './mikaTiming.js'
import { lookupTimataka } from './timataka.js'
import { lookupWiclax } from './wiclax.js'
import { lookupRaceResult } from './raceresult.js'
import { lookupSccEvents } from './sccEvents.js'
import { lookupSporthive } from './sporthive.js'

export async function lookupPlatform(
  platform: ResultsPlatform,
  resultsUrl: string | undefined,
  profile: UserResultsProfile,
  eventDate: Date,
  eventName: string,
  parkrunEvent?: { slug?: string; countryUrl?: string },
): Promise<OfficialResultCandidate[]> {
  switch (platform) {
    case 'sporthive':
      if (!resultsUrl) return []
      return lookupSporthive(resultsUrl, profile)
    case 'davengo':
      if (!resultsUrl) return []
      return lookupDavengo(resultsUrl, profile)
    case 'myraceresult':
      if (!resultsUrl) return []
      return lookupRaceResult(resultsUrl, profile)
    case 'sccevents':
      if (!resultsUrl) return []
      return lookupSccEvents(resultsUrl, profile, eventDate)
    case 'maxfunsports':
      if (!resultsUrl) return []
      return lookupMaxFunSports(resultsUrl, profile)
    case 'myracepartner':
      if (!resultsUrl) return []
      return lookupMyRacePartner(resultsUrl, profile)
    case 'strassenlauf':
      if (!resultsUrl) return []
      return lookupStrassenlauf(resultsUrl, profile)
    case 'zielzeit':
      if (!resultsUrl) return []
      return lookupZielZeit(resultsUrl, profile)
    case 'eqtiming':
      if (!resultsUrl) return []
      return lookupEqTiming(resultsUrl, profile)
    case 'nsfberlin':
      if (!resultsUrl) return []
      return lookupNsfBerlin(resultsUrl, profile)
    case 'runczech':
      if (!resultsUrl) return []
      return lookupRunCzech(resultsUrl, profile)
    case 'ultimate':
      if (!resultsUrl) return []
      return lookupUltimate(resultsUrl, profile)
    case 'vcrunning':
      if (!resultsUrl) return []
      return lookupVcRunning(resultsUrl, profile, eventDate)
    case 'wiclax':
      if (!resultsUrl) return []
      return lookupWiclax(resultsUrl, profile)
    case 'timataka':
      if (!resultsUrl) return []
      return lookupTimataka(resultsUrl, profile)
    case 'mikatiming':
      if (!resultsUrl) return []
      return lookupMikaTiming(resultsUrl, profile)
    case 'parkrun':
      return lookupParkrun(profile, eventDate, eventName, resultsUrl, parkrunEvent)
    default:
      return []
  }
}
