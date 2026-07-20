import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { detectPlatform } from './shared/detectPlatform.js'
import {
  canLookupPlatform,
  type OfficialResultCandidate,
  type UserResultsProfile,
} from './shared/types.js'
import { lookupPlatform } from './connectors/index.js'
import { resolveSccEventsUrlParts } from './connectors/sccEvents.js'
import { resolveWiclaxUrlParts } from './connectors/wiclax.js'
import { reserveOfficialResultsLookup } from './officialResultsLookupRateLimit.js'
import { callableFunctionOptions, LOOKUP_CALLABLE_CONCURRENCY, LOOKUP_CALLABLE_MAX_INSTANCES } from './functionOptions.js'

initializeApp()

type LookupRequest = {
  eventId: string
}

type EventDoc = {
  userId: string
  name: string
  date: Timestamp
  resultsUrl?: string
  resultsPlatform?: string
  parkrunEventSlug?: string
  parkrunCountryUrl?: string
}

function normalizeResultsPlatform(
  stored: string | undefined,
  resultsUrl?: string,
  eventName?: string,
): OfficialResultCandidate['platform'] | null {
  if (stored === 'raceresult' || stored === 'myraceresult') return 'myraceresult'
  if (stored === 'parkrun' || stored === 'davengo' || stored === 'sporthive' || stored === 'sccevents' || stored === 'maxfunsports' || stored === 'myracepartner' || stored === 'strassenlauf' || stored === 'zielzeit' || stored === 'eqtiming' || stored === 'nsfberlin' || stored === 'runczech' || stored === 'ultimate' || stored === 'vcrunning' || stored === 'wiclax' || stored === 'timataka' || stored === 'mikatiming')
    return stored
  return detectPlatform(resultsUrl, eventName)
}

function parseProfile(data: FirebaseFirestore.DocumentData | undefined): UserResultsProfile {
  if (!data) return {}
  return {
    resultFirstName:
      typeof data.resultFirstName === 'string' ? data.resultFirstName : undefined,
    resultLastName: typeof data.resultLastName === 'string' ? data.resultLastName : undefined,
    resultNameAliases: Array.isArray(data.resultNameAliases)
      ? data.resultNameAliases.filter((alias): alias is string => typeof alias === 'string' && alias.trim().length > 0)
      : undefined,
    parkrunnerId: typeof data.parkrunnerId === 'string' ? data.parkrunnerId : undefined,
  }
}

export const lookupOfficialResults = onCall(
  callableFunctionOptions({
    maxInstances: LOOKUP_CALLABLE_MAX_INSTANCES,
    concurrency: LOOKUP_CALLABLE_CONCURRENCY,
  }),
  async (request): Promise<{ candidates: OfficialResultCandidate[] }> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const userId = request.auth.uid
    const eventId = (request.data as LookupRequest)?.eventId
    if (!eventId || typeof eventId !== 'string') {
      throw new HttpsError('invalid-argument', 'eventId is required.')
    }

    const db = getFirestore()
    await reserveOfficialResultsLookup(db, userId)

    const eventSnap = await db.collection('events').doc(eventId).get()
    if (!eventSnap.exists) {
      throw new HttpsError('not-found', 'Event not found.')
    }

    const event = eventSnap.data() as EventDoc
    if (event.userId !== userId) {
      throw new HttpsError('permission-denied', 'Not your event.')
    }

    const userSnap = await db.collection('users').doc(userId).get()
    const profile = parseProfile(userSnap.data())

    let platform = normalizeResultsPlatform(event.resultsPlatform, event.resultsUrl, event.name)

    if (!platform && event.resultsUrl?.trim()) {
      const sccParts = await resolveSccEventsUrlParts(event.resultsUrl.trim())
      if (sccParts) platform = 'sccevents'
    }

    if (!platform && event.resultsUrl?.trim()) {
      const wiclaxParts = await resolveWiclaxUrlParts(event.resultsUrl.trim())
      if (wiclaxParts) platform = 'wiclax'
    }

    if (!platform) {
      throw new HttpsError(
        'failed-precondition',
        'Could not detect results platform. Add a results URL or use a Parkrun event name.',
      )
    }

    if (!canLookupPlatform(platform, profile, event.resultsUrl)) {
      throw new HttpsError(
        'failed-precondition',
        platform === 'parkrun'
          ? 'Configure your Parkrunner ID in settings.'
          : 'Configure your name and results URL in settings.',
      )
    }

    const eventDate = event.date.toDate()
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (eventDate > today) {
      throw new HttpsError('failed-precondition', 'Event has not happened yet.')
    }

    try {
      const candidates = await lookupPlatform(
        platform,
        event.resultsUrl,
        profile,
        eventDate,
        event.name,
        {
          slug: event.parkrunEventSlug,
          countryUrl: event.parkrunCountryUrl,
        },
      )
      return { candidates }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lookup failed.'
      throw new HttpsError('internal', message)
    }
  },
)
