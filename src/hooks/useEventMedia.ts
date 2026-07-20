import { useCallback, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { EventMedia } from '../types/EventMedia'
import {
  docToEventMedia,
  eventMediaCollectionQuery,
  listEventMediaFromServer,
} from '../services/eventMedia'

function mergeMediaItems(current: EventMedia[], incoming: EventMedia[]): EventMedia[] {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return [...byId.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
}

function snapshotToItems(eventId: string, snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) {
  return snapshot.docs.map((document) =>
    docToEventMedia(eventId, document.id, document.data()),
  )
}

export function useEventMedia(eventId: string | undefined) {
  const { user } = useAuth()
  const [items, setItems] = useState<EventMedia[]>([])
  const [loading, setLoading] = useState(Boolean(eventId && user))
  const [error, setError] = useState<string | null>(null)

  const applyServerList = useCallback((list: EventMedia[]) => {
    setItems(list)
    setError(null)
  }, [])

  const applyLoadFailure = useCallback(() => {
    setItems((current) => {
      if (current.length === 0) setError('load_failed')
      return current
    })
  }, [])

  const refresh = useCallback(async () => {
    if (!eventId || !user) return
    try {
      applyServerList(await listEventMediaFromServer(eventId))
    } catch {
      applyLoadFailure()
    }
  }, [eventId, user, applyServerList, applyLoadFailure])

  const mergeUploaded = useCallback((uploaded: EventMedia[]) => {
    if (uploaded.length === 0) return
    setItems((current) => mergeMediaItems(current, uploaded))
  }, [])

  useEffect(() => {
    if (!eventId || !user) {
      setItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    let receivedSnapshot = false
    setLoading(true)
    setError(null)

    void listEventMediaFromServer(eventId)
      .then((list) => {
        if (cancelled) return
        applyServerList(list)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        applyLoadFailure()
        setLoading(false)
      })

    const unsubscribe = onSnapshot(
      eventMediaCollectionQuery(eventId),
      (snapshot) => {
        if (cancelled) return
        receivedSnapshot = true
        applyServerList(snapshotToItems(eventId, snapshot))
        setLoading(false)
      },
      () => {
        if (cancelled || receivedSnapshot) return
        void listEventMediaFromServer(eventId)
          .then((list) => {
            if (cancelled) return
            applyServerList(list)
          })
          .catch(() => {
            if (cancelled) return
            applyLoadFailure()
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [eventId, user, applyServerList, applyLoadFailure])

  return { items, loading, error, count: items.length, refresh, mergeUploaded }
}
