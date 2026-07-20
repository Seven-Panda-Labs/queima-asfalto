import { useCallback, useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { Event, EventCreate, EventFilters } from '../types/Event'
import {
  createEvent,
  deleteEvent,
  docToEvent,
  eventsCollectionQuery,
  updateEvent,
} from '../services/events'
import { useAutoTransitions } from './useAutoTransitions'

type UseEventsOptions = EventFilters

export function useEvents(options: UseEventsOptions = {}) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusFilter = options.status ?? 'all'
  const yearFilter = options.year ?? 'all'

  useEffect(() => {
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      eventsCollectionQuery(user.uid),
      (snapshot) => {
        const nextEvents = snapshot.docs.map((document) =>
          docToEvent(document.id, document.data()),
        )
        setEvents(nextEvents)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (statusFilter !== 'all' && event.status !== statusFilter) return false
      if (yearFilter !== 'all' && event.date.getFullYear() !== yearFilter) return false
      return true
    })
  }, [events, statusFilter, yearFilter])

  const transitionedEvents = useAutoTransitions(events)

  const addEvent = useCallback(
    async (data: EventCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createEvent(user.uid, data)
    },
    [user],
  )

  const editEvent = useCallback(
    async (eventId: string, data: Partial<Omit<Event, 'id' | 'userId' | 'createdAt'>>) => {
      await updateEvent(eventId, data)
    },
    [],
  )

  const removeEvent = useCallback(async (eventId: string) => {
    await deleteEvent(eventId)
  }, [])

  const refetch = useCallback(() => {
    // onSnapshot keeps data fresh; exposed for API compatibility
  }, [])

  return {
    events: filteredEvents,
    allEvents: events,
    loading,
    error,
    refetch,
    addEvent,
    editEvent,
    removeEvent,
    transitionedEvents,
  }
}
