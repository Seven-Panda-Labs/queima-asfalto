import { useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useEvents } from '../../hooks/useEvents'
import { getFaltouMessage } from '../../utils/messages'

export function GlobalEventTransitions() {
  const { user } = useAuth()
  const toast = useToast()
  const shownRef = useRef(new Set<string>())
  const { transitionedEvents } = useEvents()

  useEffect(() => {
    for (const event of transitionedEvents) {
      if (shownRef.current.has(event.id)) continue
      toast.warning(getFaltouMessage(event.name, user?.displayName))
      shownRef.current.add(event.id)
    }
  }, [transitionedEvents, toast, user?.displayName])

  return null
}
