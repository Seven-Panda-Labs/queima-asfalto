import type { Firestore } from 'firebase-admin/firestore'
import { foldedRaceFields } from './shared/domain/raceFold.js'

/**
 * Makes race `fromId` part of race `intoId`, both the account's own.
 *
 * Everything that pointed at `from` points at `into`, the races prepared for
 * it included, and `from` is deleted. One batch, so a failure leaves both
 * races as they were rather than half of the history on each.
 */
export async function foldRaceInto(db: Firestore, userId: string, fromId: string, intoId: string): Promise<void> {
  const races = db.collection('races')
  const [from, into] = await Promise.all([races.doc(fromId).get(), races.doc(intoId).get()])
  const fromData = from.data()
  const intoData = into.data()
  if (fromData?.userId !== userId || intoData?.userId !== userId) return

  const pointingAt = (collectionName: string, field: string) =>
    db.collection(collectionName).where('userId', '==', userId).where(field, '==', fromId).get()
  const [events, wishes, entries, prepared] = await Promise.all([
    pointingAt('events', 'raceId'),
    pointingAt('bucketListItems', 'raceId'),
    pointingAt('raceEntries', 'raceId'),
    pointingAt('races', 'servesRaceId'),
  ])

  // A Date, so this module needs nothing from firebase-admin at runtime and the
  // repair script can hand in the Firestore it loaded itself.
  const updatedAt = new Date()
  const batch = db.batch()
  for (const document of [...events.docs, ...wishes.docs, ...entries.docs]) {
    batch.update(document.ref, { raceId: intoId, updatedAt })
  }
  for (const document of prepared.docs) {
    batch.update(document.ref, { servesRaceId: intoId, updatedAt })
  }
  const fields = foldedRaceFields(intoData, fromData)
  batch.update(into.ref, {
    ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value != null)),
    updatedAt,
  })
  batch.delete(from.ref)
  await batch.commit()
}
