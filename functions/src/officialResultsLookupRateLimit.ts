import { HttpsError } from 'firebase-functions/v2/https'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { officialResultsLookupRateLimitPath } from './shared/lookupRateLimit.js'
import { officialResultsLookupRemainingMs } from './shared/lookupCooldown.js'

function lastLookupAtMillis(data: FirebaseFirestore.DocumentData | undefined): number {
  const value = data?.lastLookupAt
  return value instanceof Timestamp ? value.toMillis() : 0
}

export async function reserveOfficialResultsLookup(
  db: Firestore,
  userId: string,
  now = Date.now(),
): Promise<void> {
  const ref = db.doc(officialResultsLookupRateLimitPath(userId))

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const remainingMs = officialResultsLookupRemainingMs(lastLookupAtMillis(snap.data()), now)
    if (remainingMs > 0) {
      return { allowed: false as const, remainingMs }
    }

    tx.set(ref, { lastLookupAt: Timestamp.fromMillis(now) }, { merge: true })
    return { allowed: true as const }
  })

  if (!result.allowed) {
    throw new HttpsError('resource-exhausted', 'Please wait before searching again.', {
      retryAfterMs: result.remainingMs,
    })
  }
}
