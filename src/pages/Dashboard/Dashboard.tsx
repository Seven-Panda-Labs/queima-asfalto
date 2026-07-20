import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GoalCard } from '../../components/GoalCard'
import { PerformanceGoalCard } from '../../components/PerformanceGoalCard'
import { NextEventCard } from '../../components/NextEventCard'
import { StatCard } from '../../components/StatCard'
import { PageShell } from '../../components/PageShell/PageShell'
import { useAuth } from '../../contexts/AuthContext'
import { useEvents } from '../../hooks/useEvents'
import { useGoals } from '../../hooks/useGoals'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { computeBestPerformances } from '../../utils/bestPerformances'
import { computeDashboardStats } from '../../utils/stats'
import { findNextEvent } from '../../utils/nextEvent'
import { formatDatePt } from '../../utils/date'

export function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const { allEvents, loading: eventsLoading } = useEvents()
  const { goals, loading: goalsLoading, error: goalsError } = useGoals({ year: currentYear })
  const {
    goals: performanceGoals,
    loading: performanceLoading,
    error: performanceError,
  } = usePerformanceGoals({ year: currentYear })

  const featuredPerformanceGoals = performanceGoals.slice(0, 3)

  const nextEvent = findNextEvent(allEvents)
  const stats = computeDashboardStats(allEvents, currentYear)
  const bestPerformances = computeBestPerformances(allEvents)

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
          <div className="h-24 animate-pulse rounded-lg bg-border/60" aria-hidden />
        ) : (
          <NextEventCard event={nextEvent} />
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-primary">
          {t('dashboard.statsYear', { year: currentYear })}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard value={stats.totalEvents} label={t('dashboard.eventsInYear', { year: currentYear })} />
          <StatCard value={stats.averagePace ?? '—'} label={t('dashboard.averagePace')} />
          <StatCard value={stats.completedCount} label={t('dashboard.completedEvents')} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-primary">
              {t('dashboard.annualGoals', { year: currentYear })}
            </h2>
          </div>
          <Link to="/objetivos" className="text-sm font-semibold text-primary hover:underline">
            {t('dashboard.viewAllGoals')} →
          </Link>
        </div>

        {goalsError ? <p className="mt-4 text-sm text-danger">{goalsError}</p> : null}

        {goalsLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg bg-border/60" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-surface p-6">
            <p className="text-muted">{t('dashboard.noGoals', { year: currentYear })}</p>
            <Link
              to="/objetivos/novo"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              {t('dashboard.createFirstGoal')}
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} compact showActions={false} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-primary">
              {t('dashboard.performanceGoals')}
            </h2>
          </div>
          <Link to="/objetivos" className="text-sm font-semibold text-primary hover:underline">
            {t('dashboard.viewAllGoals')} →
          </Link>
        </div>

        {performanceError ? <p className="mt-4 text-sm text-danger">{performanceError}</p> : null}

        {performanceLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg bg-border/60" />
            ))}
          </div>
        ) : featuredPerformanceGoals.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-surface p-6">
            <p className="text-muted">{t('dashboard.noPerformanceGoals', { year: currentYear })}</p>
            <Link
              to="/objetivos/performance/novo"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              {t('dashboard.createFirstPerformanceGoal')}
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPerformanceGoals.map((goal) => (
              <PerformanceGoalCard key={goal.id} goal={goal} compact showActions={false} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-primary">{t('dashboard.bestPerformances')}</h2>
        <p className="text-sm text-muted">{t('dashboard.bestPerformancesSubtitle')}</p>

        {bestPerformances.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-surface p-6">
            <p className="text-muted">{t('dashboard.noResultsYet')}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bestPerformances.map((performance) => (
              <div
                key={performance.eventType}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="text-sm font-semibold text-primary">{performance.label}</p>
                <p className="mt-2 font-bold text-foreground">{performance.eventName}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatDatePt(performance.date)} · {performance.recordAge}
                </p>
                <div className="mt-3 flex gap-4 text-sm">
                  <span>
                    <span className="text-muted">{t('common.time')}: </span>
                    <span className="font-semibold">{performance.time}</span>
                  </span>
                  <span>
                    <span className="text-muted">{t('common.pace')}: </span>
                    <span className="font-semibold">{performance.pace} min/Km</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
