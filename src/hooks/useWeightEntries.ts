import { useCallback, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import {
  createWeightEntry,
  deleteWeightEntry,
  docToWeightEntry,
  updateWeightEntry,
  weightEntriesQuery,
} from '../services/weightEntries'
import type { WeightEntry } from '../types/WeightEntry'
import { reportLoadError } from '../utils/loadError'
import { sortByDate } from '../utils/weightLog'

export function useWeightEntries() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<WeightEntry[]>([])
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
      weightEntriesQuery(user.uid),
      (snapshot) => {
        setEntries(sortByDate(snapshot.docs.map((document) => docToWeightEntry(document.id, document.data()))))
        setLoading(false)
      },
      (snapshotError) => {
        setError(reportLoadError(snapshotError, 'tools.weightLog.loadError', 'useWeightEntries'))
        setLoading(false)
      },
    )
  }, [user])

  /** One weigh-in per day: saving a day that already has one corrects it. */
  const saveWeight = useCallback(
    async (date: string, weightKg: number): Promise<'created' | 'updated'> => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      const existing = entries.find((entry) => entry.date === date)
      if (existing) {
        await updateWeightEntry(existing.id, weightKg)
        return 'updated'
      }
      await createWeightEntry(user.uid, date, weightKg)
      return 'created'
    },
    [user, entries],
  )

  const removeWeight = useCallback(async (entryId: string) => {
    await deleteWeightEntry(entryId)
  }, [])

  return { entries, loading, error, saveWeight, removeWeight }
}
