import { useCallback, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n'
import type { Event } from '../types/Event'
import type { Goal, GoalWithProgress } from '../types/Goal'
import type { PerformanceGoal, PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import type { SharePermissions, SharedDataSection } from '../types/Share'
import { fetchSharedSnapshot } from '../services/shares'
import { computeAllGoalsProgress } from '../utils/goalProgress'
import { computeAllPerformanceGoalsProgress } from '../utils/performanceGoalProgress'
import { getSharedGoalsCache, setSharedGoalsCache } from '../utils/sharedDataCache'
import { hasSectionReadAccess, hasEventsAccess } from '../../shared/shares/permissions'

function buildGoalsSections(sharePermissions: SharePermissions | null): SharedDataSection[] {
  if (!sharePermissions) return []
  const sections: SharedDataSection[] = []
  if (hasSectionReadAccess(sharePermissions.goals)) sections.push('goals')
  if (hasSectionReadAccess(sharePermissions.performanceGoals)) sections.push('performanceGoals')
  if (sections.length > 0 && hasEventsAccess(sharePermissions.events)) sections.push('events')
  return sections
}

export function useSharedGoals(
  ownerId: string | null,
  sharePermissions: SharePermissions | null,
  year?: number,
) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [performanceGoals, setPerformanceGoals] = useState<PerformanceGoal[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [ownerDisplayName, setOwnerDisplayName] = useState('')
  const [permissions, setPermissions] = useState<SharePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyCache = useCallback((owner: string) => {
    const cached = getSharedGoalsCache(owner)
    if (!cached) return false
    setGoals(cached.goals)
    setPerformanceGoals(cached.performanceGoals)
    setEvents(cached.events)
    setOwnerDisplayName(cached.ownerDisplayName)
    setPermissions(cached.permissions)
    return true
  }, [])

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setGoals([])
      setPerformanceGoals([])
      setEvents([])
      setOwnerDisplayName('')
      setPermissions(null)
      setLoading(false)
      return
    }

    const sections = buildGoalsSections(sharePermissions)
    if (sections.length === 0) {
      setGoals([])
      setPerformanceGoals([])
      setEvents([])
      setOwnerDisplayName('')
      setPermissions(sharePermissions)
      setLoading(false)
      return
    }

    const hasCache = applyCache(ownerId)
    if (!hasCache) setLoading(true)
    setError(null)

    try {
      const snapshot = await fetchSharedSnapshot(ownerId, sections)
      const entry = {
        goals: snapshot.goals,
        performanceGoals: snapshot.performanceGoals,
        events: snapshot.events,
        ownerDisplayName: snapshot.ownerDisplayName,
        permissions: snapshot.permissions,
      }
      setSharedGoalsCache(ownerId, entry)
      setGoals(entry.goals)
      setPerformanceGoals(entry.performanceGoals)
      setEvents(entry.events)
      setOwnerDisplayName(entry.ownerDisplayName)
      setPermissions(entry.permissions)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : i18n.t('shares.loadError'))
      if (!hasCache) {
        setGoals([])
        setPerformanceGoals([])
        setEvents([])
      }
    } finally {
      setLoading(false)
    }
  }, [ownerId, sharePermissions, applyCache])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredGoals = useMemo(() => {
    if (year === undefined) return goals
    return goals.filter((goal) => goal.year === year)
  }, [goals, year])

  const filteredPerformanceGoals = useMemo(() => {
    if (year === undefined) return performanceGoals
    return performanceGoals.filter((goal) => goal.year === year)
  }, [performanceGoals, year])

  const goalsWithProgress = useMemo<GoalWithProgress[]>(
    () => computeAllGoalsProgress(filteredGoals, events),
    [filteredGoals, events],
  )

  const performanceGoalsWithProgress = useMemo<PerformanceGoalWithProgress[]>(
    () => computeAllPerformanceGoalsProgress(filteredPerformanceGoals, events),
    [filteredPerformanceGoals, events],
  )

  const showGoals = permissions ? hasSectionReadAccess(permissions.goals) : false
  const showPerformanceGoals = permissions
    ? hasSectionReadAccess(permissions.performanceGoals)
    : false

  return {
    goals: goalsWithProgress,
    allGoals: goals,
    performanceGoals: performanceGoalsWithProgress,
    allPerformanceGoals: performanceGoals,
    ownerDisplayName,
    permissions,
    showGoals,
    showPerformanceGoals,
    loading,
    error,
    refresh,
  }
}
