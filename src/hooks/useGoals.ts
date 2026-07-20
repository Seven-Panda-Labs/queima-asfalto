import { useCallback, useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { Goal, GoalCreate, GoalWithProgress } from '../types/Goal'
import { useEvents } from './useEvents'
import {
  createGoal,
  deleteGoal,
  docToGoal,
  goalsCollectionQuery,
  updateGoal,
} from '../services/goals'
import { computeAllGoalsProgress } from '../utils/goalProgress'

type UseGoalsOptions = {
  year?: number
}

export function useGoals(options: UseGoalsOptions = {}) {
  const { user } = useAuth()
  const { allEvents } = useEvents()
  const [goals, setGoals] = useState<Goal[]>([])
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
      goalsCollectionQuery(user.uid),
      (snapshot) => {
        const nextGoals = snapshot.docs.map((document) =>
          docToGoal(document.id, document.data()),
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

  const goalsWithProgress = useMemo<GoalWithProgress[]>(
    () => computeAllGoalsProgress(filteredGoals, allEvents),
    [filteredGoals, allEvents],
  )

  const addGoal = useCallback(
    async (data: GoalCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createGoal(user.uid, data)
    },
    [user],
  )

  const editGoal = useCallback(
    async (goalId: string, data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>) => {
      await updateGoal(goalId, data)
    },
    [],
  )

  const removeGoal = useCallback(async (goalId: string) => {
    await deleteGoal(goalId)
  }, [])

  return {
    goals: goalsWithProgress,
    allGoals: goals,
    loading,
    error,
    addGoal,
    editGoal,
    removeGoal,
  }
}
