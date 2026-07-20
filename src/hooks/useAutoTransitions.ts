import { useEffect, useRef, useState } from 'react'
import { updateEvent } from '../services/events'
import type { Event } from '../types/Event'
import { applyAutoTransitions } from '../utils/stateTransitions'

export function useAutoTransitions(events: Event[]) {
  const [transitionedEvents, setTransitionedEvents] = useState<Event[]>([])
  const inFlightRef = useRef(new Set<string>())

  useEffect(() => {
    const candidates = applyAutoTransitions(events).filter(
      (event) => !inFlightRef.current.has(event.id),
    )

    if (candidates.length === 0) return

    let cancelled = false

    void (async () => {
      const updated: Event[] = []

      for (const event of candidates) {
        inFlightRef.current.add(event.id)
        try {
          await updateEvent(event.id, { status: 'missed' })
          if (!cancelled) updated.push(event)
        } finally {
          inFlightRef.current.delete(event.id)
        }
      }

      if (!cancelled && updated.length > 0) {
        setTransitionedEvents((current) => [...current, ...updated])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [events])

  return transitionedEvents
}
