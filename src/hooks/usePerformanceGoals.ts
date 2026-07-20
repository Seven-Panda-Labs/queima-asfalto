import { useCallback, useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type {
  PerformanceGoal,
  PerformanceGoalCreate,
  PerformanceGoalWithProgress,
} from '../types/PerformanceGoal'
import {
  createPerformanceGoal,
  deletePerformanceGoal,
  docToPerformanceGoal,
  performanceGoalsCollectionQuery,
  updatePerformanceGoal,
} from '../services/performanceGoals'
import { useEvents } from './useEvents'
import { computeAllPerformanceGoalsProgress } from '../utils/performanceGoalProgress'

type UsePerformanceGoalsOptions = {
  year?: number
}

export function usePerformanceGoals(options: UsePerformanceGoalsOptions = {}) {
  const { user } = useAuth()
  const { allEvents } = useEvents()
  const [goals, setGoals] = useState<PerformanceGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const yearFilter = options.year

  useEffect(() => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      performanceGoalsCollectionQuery(user.uid),
      (snapshot) => {
        const nextGoals = snapshot.docs.map((document) =>
          docToPerformanceGoal(document.id, document.data()),
        )
        setGoals(nextGoals)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const filteredGoals = useMemo(() => {
    if (yearFilter === undefined) return goals
    return goals.filter((goal) => goal.year === yearFilter)
  }, [goals, yearFilter])

  const goalsWithProgress = useMemo<PerformanceGoalWithProgress[]>(
    () => computeAllPerformanceGoalsProgress(filteredGoals, allEvents),
    [filteredGoals, allEvents],
  )

  const addPerformanceGoal = useCallback(
    async (data: PerformanceGoalCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createPerformanceGoal(user.uid, data)
    },
    [user],
  )

  const editPerformanceGoal = useCallback(
    async (
      goalId: string,
      data: Partial<Omit<PerformanceGoal, 'id' | 'userId' | 'createdAt'>>,
    ) => {
      await updatePerformanceGoal(goalId, data)
    },
    [],
  )

  const removePerformanceGoal = useCallback(async (goalId: string) => {
    await deletePerformanceGoal(goalId)
  }, [])

  return {
    goals: goalsWithProgress,
    allGoals: goals,
    loading,
    error,
    addPerformanceGoal,
    editPerformanceGoal,
    removePerformanceGoal,
  }
}
