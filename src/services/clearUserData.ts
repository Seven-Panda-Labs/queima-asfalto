import { collection, deleteDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore'
import { db } from './firebase'
import { deleteEventMediaFile } from './eventMediaStorage'
import { deleteEventTrackFile } from './eventTrackStorage'

const BATCH_SIZE = 500

export type ClearUserDataOptions = {
  /**
   * Also delete everything stored under an event, `media` and `track`, together
   * with their Storage objects.
   *
   * Defaults to false. The backup restore, the only caller today, passes true.
   */
  includeEventSubcollections?: boolean
}

export type ClearUserDataResult = {
  eventsDeleted: number
  goalsDeleted: number
  bucketListDeleted: number
  racesDeleted: number
  performanceGoalsDeleted: number
  eventMediaDeleted: number
  eventTracksDeleted: number
}

async function deleteCollectionDocs(userId: string, collectionName: string): Promise<number> {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where('userId', '==', userId)),
  )

  const docs = snapshot.docs
  for (let index = 0; index < docs.length; index += BATCH_SIZE) {
    const chunk = docs.slice(index, index + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const document of chunk) {
      batch.delete(doc(db, collectionName, document.id))
    }
    await batch.commit()
  }

  return docs.length
}

/**
 * Deletes every media document and Storage object under the user's events.
 *
 * Must run *before* the events themselves: the media read rule resolves
 * `get(events/{eventId}).data.userId`, so once the parent event is gone the rule
 * errors and denies, leaving media documents that can never be listed again,
 * and therefore never enumerated to delete.
 */
async function deleteEventMediaForUser(userId: string): Promise<number> {
  const events = await getDocs(query(collection(db, 'events'), where('userId', '==', userId)))

  let deleted = 0
  for (const event of events.docs) {
    const media = await getDocs(collection(db, 'events', event.id, 'media'))
    if (media.empty) continue

    await Promise.all(
      media.docs.map(async (document) => {
        const storagePath = document.data().storagePath
        if (typeof storagePath !== 'string') return
        try {
          await deleteEventMediaFile(storagePath)
        } catch {
          // An already-missing object must not block the metadata delete.
        }
      }),
    )

    for (let index = 0; index < media.docs.length; index += BATCH_SIZE) {
      const chunk = media.docs.slice(index, index + BATCH_SIZE)
      const batch = writeBatch(db)
      for (const document of chunk) {
        batch.delete(doc(db, 'events', event.id, 'media', document.id))
      }
      await batch.commit()
    }

    deleted += media.docs.length
  }

  return deleted
}

/**
 * Deletes the track document and Storage object under each of the user's events.
 *
 * Runs before the events for the same reason as the media above: the track read
 * rule resolves the parent event, so once the event is gone the document can no
 * longer be listed, and therefore never deleted.
 */
async function deleteEventTracksForUser(userId: string): Promise<number> {
  const events = await getDocs(query(collection(db, 'events'), where('userId', '==', userId)))

  let deleted = 0
  for (const event of events.docs) {
    const tracks = await getDocs(collection(db, 'events', event.id, 'track'))
    if (tracks.empty) continue

    for (const document of tracks.docs) {
      const storagePath = document.data().storagePath
      if (typeof storagePath === 'string') {
        try {
          await deleteEventTrackFile(storagePath)
        } catch {
          // An already-missing object must not block the metadata delete.
        }
      }
      await deleteDoc(doc(db, 'events', event.id, 'track', document.id))
      deleted += 1
    }
  }

  return deleted
}

export async function clearAllUserData(
  userId: string,
  options: ClearUserDataOptions = {},
): Promise<ClearUserDataResult> {
  const eventMediaDeleted = options.includeEventSubcollections
    ? await deleteEventMediaForUser(userId)
    : 0
  const eventTracksDeleted = options.includeEventSubcollections
    ? await deleteEventTracksForUser(userId)
    : 0

  const [eventsDeleted, goalsDeleted, bucketListDeleted, performanceGoalsDeleted, racesDeleted] =
    await Promise.all([
      deleteCollectionDocs(userId, 'events'),
      deleteCollectionDocs(userId, 'goals'),
      deleteCollectionDocs(userId, 'bucketListItems'),
      deleteCollectionDocs(userId, 'performanceGoals'),
      deleteCollectionDocs(userId, 'races'),
    ])

  return {
    eventsDeleted,
    goalsDeleted,
    bucketListDeleted,
    racesDeleted,
    performanceGoalsDeleted,
    eventMediaDeleted,
    eventTracksDeleted,
  }
}
