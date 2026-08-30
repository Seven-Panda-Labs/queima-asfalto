import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { docToEventTrack, eventTrackDocRef } from '../services/eventTrack'
import type { EventTrack } from '../types/EventTrack'

/** One document, so this watches it directly instead of querying a collection. */
export function useEventTrack(eventId: string | undefined) {
  const { user } = useAuth()
  const [track, setTrack] = useState<EventTrack | null>(null)
  const [loading, setLoading] = useState(Boolean(eventId && user))

  useEffect(() => {
    if (!eventId || !user) {
      setTrack(null)
      setLoading(false)
      return
    }

    setLoading(true)
    return onSnapshot(
      eventTrackDocRef(eventId),
      (snapshot) => {
        setTrack(
          snapshot.exists() ? docToEventTrack(eventId, snapshot.id, snapshot.data()) : null,
        )
        setLoading(false)
      },
      () => {
        // A track that cannot be read is the same as none for the editor's purposes.
        setTrack(null)
        setLoading(false)
      },
    )
  }, [eventId, user])

  return { track, loading }
}
