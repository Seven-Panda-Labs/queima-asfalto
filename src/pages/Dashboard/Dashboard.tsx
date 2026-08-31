import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AchievementShelf } from '../../components/AchievementShelf'
import { NextEventCard } from '../../components/NextEventCard'
import {
  FinishFlagIcon,
  RoadIcon,
  StatStrip,
  StopwatchIcon,
} from '../../components/StatStrip'
import { RecordStrip } from '../../components/RecordStrip'
import { TargetCard } from '../../components/TargetCard'
import { PageShell } from '../../components/PageShell/PageShell'
import { useAuth } from '../../contexts/AuthContext'
import { useEvents } from '../../hooks/useEvents'
import { buildCourseComparison } from '../../utils/analytics/course'
import { useGoals } from '../../hooks/useGoals'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { computeBestPerformances } from '../../utils/bestPerformances'
import { computeDashboardHighlights } from '../../utils/dashboardHighlights'
import { computeDashboardStats } from '../../utils/stats'
import { findNextEvent } from '../../utils/nextEvent'

/** Quantos objetivos por cumprir cabem antes de remeter para a página de objetivos. */
const FEATURED_TARGETS = 3

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const { allEvents, loading: eventsLoading, error: eventsError } = useEvents()
  const { goals, loading: goalsLoading, error: goalsError } = useGoals({ year: currentYear })
  const {
    goals: performanceGoals,
    loading: performanceLoading,
    error: performanceError,
  } = usePerformanceGoals({ year: currentYear })

  const nextEvent = findNextEvent(allEvents)

  // Only for a course already run. buildCourseComparison returns the upcoming
  // shape exactly when the race has no result of its own yet.
  const nextEventTarget = useMemo(() => {
    if (!nextEvent) return null
    const comparison = buildCourseComparison(nextEvent, allEvents)
    if (comparison?.kind !== 'upcoming') return null
    return {
      targetSeconds: comparison.targetSeconds,
      paceSeconds: comparison.best.result.paceSeconds,
      runs: comparison.runs.length,
    }
  }, [nextEvent, allEvents])
  const stats = computeDashboardStats(allEvents, currentYear)
  const bestPerformances = computeBestPerformances(allEvents)
  const highlights = computeDashboardHighlights(goals, performanceGoals)

  const featuredTargets = highlights.targets.slice(0, FEATURED_TARGETS)
  const hiddenTargets = highlights.targets.length - featuredTargets.length
  const goalsPending = goalsLoading || performanceLoading
  const goalsFailure = goalsError ?? performanceError


  const greeting = !user?.displayName
    ? t('dashboard.greeting')
    : (() => {
        const firstName = user.displayName.trim().split(/\s+/)[0]
        return firstName ? t('dashboard.greetingName', { name: firstName }) : t('dashboard.greeting')
      })()

  return (
    <PageShell greeting={greeting} title={t('nav.dashboard')}>
      <section className="mt-6">
        {eventsLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden />
        ) : eventsError ? (
          // Sem os eventos não se sabe o que vem a seguir. Dizê-lo é melhor do
          // que mostrar «sem eventos futuros», que seria uma afirmação falsa.
          <p className="rounded-2xl border border-danger/40 bg-surface p-5 text-sm text-danger">
            {eventsError}
          </p>
        ) : (
          <NextEventCard event={nextEvent} target={nextEventTarget} />
        )}
      </section>

      <section className="mt-5">
        <StatStrip
          items={[
            {
              icon: <RoadIcon />,
              value: eventsError
                ? t('common.dash')
                : stats.completedDistanceKm.toLocaleString(i18n.language),
              label: t('dashboard.kilometresInYear', { year: currentYear }),
            },
            {
              icon: <FinishFlagIcon />,
              value: eventsError ? t('common.dash') : `${stats.completedCount}/${stats.totalEvents}`,
              label: t('dashboard.completedEvents'),
            },
            {
              icon: <StopwatchIcon />,
              value: eventsError ? t('common.dash') : (stats.averagePace ?? t('common.dash')),
              label: t('dashboard.averagePace'),
            },
          ]}
        />
      </section>

      {goalsFailure ? <p className="mt-6 text-sm text-danger">{goalsFailure}</p> : null}

      <section className="mt-8">
        {goalsPending ? (
          <div className="h-32 animate-pulse rounded-2xl bg-border/60" aria-hidden />
        ) : (
          <AchievementShelf
            title={t('dashboard.achievements', { year: currentYear })}
            emptyText={t('dashboard.achievementsEmpty', { year: currentYear })}
            achievements={highlights.achievements}
          />
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {t('dashboard.inProgress')}
          </h2>
          <Link to="/objetivos" className="text-sm font-semibold text-primary hover:underline">
            {hiddenTargets > 0
              ? t('dashboard.moreTargets', { count: hiddenTargets })
              : t('dashboard.viewAllGoals')}{' '}
            <span className="inline-block rtl:-scale-x-100">→</span>
          </Link>
        </div>

        {goalsPending ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl bg-border/60" />
            ))}
          </div>
        ) : featuredTargets.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {highlights.achievements.length > 0
              ? t('dashboard.allTargetsDone')
              : t('dashboard.noGoals', { year: currentYear })}{' '}
            <Link to="/objetivos/novo" className="font-semibold text-primary hover:underline">
              {t('dashboard.createGoal')}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTargets.map((target) => (
              <TargetCard key={target.id} target={target} />
            ))}
          </div>
        )}
      </section>

      <RecordStrip records={bestPerformances} />
    </PageShell>
  )
}
