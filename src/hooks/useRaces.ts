import { useCallback, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { Race, RaceCreate } from '../types/Race'
import {
  createRace,
  deleteRace,
  docToRace,
  racesCollectionQuery,
  updateRace,
} from '../services/races'
import { reportLoadError } from '../utils/loadError'

export function useRaces() {
  const { user } = useAuth()
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRaces([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      racesCollectionQuery(user.uid),
      (snapshot) => {
        setRaces(snapshot.docs.map((document) => docToRace(document.id, document.data())))
        setLoading(false)
      },
      (snapshotError) => {
        setError(reportLoadError(snapshotError, 'errors.racesLoadError', 'useRaces'))
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const addRace = useCallback(
    async (data: RaceCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createRace(user.uid, data)
    },
    [user],
  )

  const editRace = useCallback(
    async (raceId: string, data: Partial<Omit<Race, 'id' | 'userId' | 'createdAt'>>) => {
      await updateRace(raceId, data)
    },
    [],
  )

  const removeRace = useCallback(async (raceId: string) => {
    await deleteRace(raceId)
  }, [])

  return { races, loading, error, addRace, editRace, removeRace }
}
