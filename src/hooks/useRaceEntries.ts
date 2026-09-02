import { useCallback, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { RaceEntry, RaceEntryCreate } from '../types/RaceEntry'
import {
  createRaceEntry,
  deleteRaceEntry,
  docToRaceEntry,
  raceEntriesCollectionQuery,
  updateRaceEntry,
} from '../services/raceEntries'
import { reportLoadError } from '../utils/loadError'

export function useRaceEntries() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<RaceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    return onSnapshot(
      raceEntriesCollectionQuery(user.uid),
      (snapshot) => {
        setEntries(snapshot.docs.map((document) => docToRaceEntry(document.id, document.data())))
        setLoading(false)
      },
      (snapshotError) => {
        setError(reportLoadError(snapshotError, 'errors.raceEntriesLoadError', 'useRaceEntries'))
        setLoading(false)
      },
    )
  }, [user])

  const addEntry = useCallback(
    async (data: RaceEntryCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createRaceEntry(user.uid, data)
    },
    [user],
  )

  const editEntry = useCallback(async (entryId: string, data: Partial<RaceEntryCreate>) => {
    await updateRaceEntry(entryId, data)
  }, [])

  const removeEntry = useCallback(async (entryId: string) => {
    await deleteRaceEntry(entryId)
  }, [])

  return { entries, loading, error, addEntry, editEntry, removeEntry }
}
