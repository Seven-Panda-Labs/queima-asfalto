import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore'
import { db } from './firebase'

const BATCH_SIZE = 500

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

export async function clearAllUserData(userId: string): Promise<{
  eventsDeleted: number
  goalsDeleted: number
  bucketListDeleted: number
  performanceGoalsDeleted: number
}> {
  const [eventsDeleted, goalsDeleted, bucketListDeleted, performanceGoalsDeleted] =
    await Promise.all([
      deleteCollectionDocs(userId, 'events'),
      deleteCollectionDocs(userId, 'goals'),
      deleteCollectionDocs(userId, 'bucketListItems'),
      deleteCollectionDocs(userId, 'performanceGoals'),
    ])

  return { eventsDeleted, goalsDeleted, bucketListDeleted, performanceGoalsDeleted }
}
