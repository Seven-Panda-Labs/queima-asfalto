import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { eventsCollectionQuery } from '../services/events'
import { useOnlineStatus } from './useOnlineStatus'

export type FirestoreSyncStatus = 'synced' | 'syncing' | 'offline'

export function useFirestoreSync(): FirestoreSyncStatus {
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const [hasPendingWrites, setHasPendingWrites] = useState(false)

  useEffect(() => {
    if (!user) {
      setHasPendingWrites(false)
      return
    }

    const unsubscribe = onSnapshot(
      eventsCollectionQuery(user.uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        setHasPendingWrites(snapshot.metadata.hasPendingWrites)
      },
    )

    return unsubscribe
  }, [user])

  if (!isOnline) return 'offline'
  if (hasPendingWrites) return 'syncing'
  return 'synced'
}
