import { httpsCallable } from 'firebase/functions'
import type { OfficialResultCandidate } from '../../shared/officialResults'
import { functions } from './firebase'

type LookupResponse = {
  candidates: OfficialResultCandidate[]
}

export async function lookupOfficialResults(eventId: string): Promise<OfficialResultCandidate[]> {
  const callable = httpsCallable<{ eventId: string }, LookupResponse>(
    functions,
    'lookupOfficialResults',
  )
  const result = await callable({ eventId })
  return result.data.candidates
}
