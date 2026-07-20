import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { GoalCard } from '../../components/GoalCard'
import { PerformanceGoalCard } from '../../components/PerformanceGoalCard'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useGoals } from '../../hooks/useGoals'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { useSharedGoals } from '../../hooks/useSharedGoals'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import type { GoalWithProgress } from '../../types/Goal'
import { formatGoalLabel } from '../../types/Goal'
import type { PerformanceGoalWithProgress } from '../../types/PerformanceGoal'
import { formatPerformanceGoalLabel } from '../../types/PerformanceGoal'

function GoalsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
        active ? 'bg-primary text-white' : 'bg-surface text-muted ring-1 ring-border hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function Goals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [goalToDelete, setGoalToDelete] = useState<GoalWithProgress | null>(null)
  const [performanceGoalToDelete, setPerformanceGoalToDelete] =
    useState<PerformanceGoalWithProgress | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    tabs: ownerTabs,
    activeOwnerId,
    activeOwner,
    isSharedView,
    setActiveOwnerId,
  } = useSharedOwnerTabs('goals', 'shares.goalsTabMine')

  const ownGoals = useGoals({ year: yearFilter })
  const ownPerformanceGoals = usePerformanceGoals({ year: yearFilter })
  const sharedGoals = useSharedGoals(activeOwnerId, activeOwner?.permissions ?? null, yearFilter)

  const goals = isSharedView ? sharedGoals.goals : ownGoals.goals
  const allGoals = isSharedView ? sharedGoals.allGoals : ownGoals.allGoals
  const performanceGoals = isSharedView ? sharedGoals.performanceGoals : ownPerformanceGoals.goals
  const allPerformanceGoals = isSharedView
    ? sharedGoals.allPerformanceGoals
    : ownPerformanceGoals.allGoals
  const loading = isSharedView ? sharedGoals.loading : ownGoals.loading
  const performanceLoading = isSharedView ? sharedGoals.loading : ownPerformanceGoals.loading
  const error = isSharedView ? sharedGoals.error : ownGoals.error
  const performanceError = isSharedView ? sharedGoals.error : ownPerformanceGoals.error
  const removeGoal = ownGoals.removeGoal
  const removePerformanceGoal = ownPerformanceGoals.removePerformanceGoal
  const showGoals = isSharedView ? sharedGoals.showGoals : true
  const showPerformanceGoals = isSharedView ? sharedGoals.showPerformanceGoals : true

  const canModifyYear = !isSharedView && yearFilter >= currentYear

  const availableYears = useMemo(() => {
    const years = new Set([
      ...allGoals.map((goal) => goal.year),
      ...allPerformanceGoals.map((goal) => goal.year),
    ])
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [allGoals, allPerformanceGoals, currentYear])

  async function handleConfirmDelete() {
    if (!goalToDelete) return

    setDeleting(true)
    try {
      await removeGoal(goalToDelete.id)
      setSuccessMessage(t('goals.goalDeleted', { name: formatGoalLabel(goalToDelete) }))
      setGoalToDelete(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleConfirmDeletePerformance() {
    if (!performanceGoalToDelete) return

    setDeleting(true)
    try {
      await removePerformanceGoal(performanceGoalToDelete.id)
      setSuccessMessage(
        t('goals.performanceDeleted', { name: formatPerformanceGoalLabel(performanceGoalToDelete) }),
      )
      setPerformanceGoalToDelete(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageShell title={t('goals.title')}>
      <div className="mt-6 flex flex-col gap-6">
        <SharedOwnerTabs
          tabs={ownerTabs}
          activeOwnerId={activeOwnerId}
          onChange={setActiveOwnerId}
          ariaLabelKey="shares.goalsTabsLabel"
        />

        {isSharedView && loading ? (
          <SharedDataLoading section="goals" ownerName={activeOwner?.label ?? ''} />
        ) : (
          <>
        {isSharedView ? (
          <SharedContextBanner
            message={t('shares.sharedGoalsBanner', {
              name: activeOwner?.label ?? '',
            })}
          />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">{t('goals.subtitle')}</p>
          {canModifyYear ? (
            <Link
              to="/objetivos/novo"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              ➕ {t('common.add')}
            </Link>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{t('common.year')}</p>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((year) => (
              <FilterButton
                key={year}
                active={yearFilter === year}
                onClick={() => setYearFilter(year)}
              >
                {year}
              </FilterButton>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {performanceError ? <p className="text-sm text-danger">{performanceError}</p> : null}
        {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

        {showGoals ? (
          !isSharedView && loading ? (
            <GoalsSkeleton />
          ) : goals.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center">
              <p className="text-lg font-semibold text-foreground">
                {isSharedView
                  ? t('voice.empty.shared.goals.title')
                  : t('voice.empty.own.goals.title', { year: yearFilter })}
              </p>
              {isSharedView ? (
                <p className="mt-2 text-muted">
                  {t('voice.empty.shared.goals.hint', {
                    name: activeOwner?.label ?? '',
                    year: yearFilter,
                  })}
                </p>
              ) : (
                <p className="mt-2 text-muted">
                  {t('voice.empty.own.goals.hint')}{' '}
                  <span className="font-semibold text-accent">{t('common.letsGo')}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={isSharedView ? undefined : (goalId) => navigate(`/objetivos/${goalId}/editar`)}
                  onDelete={isSharedView ? undefined : setGoalToDelete}
                  showActions={!isSharedView && goal.year >= currentYear}
                />
              ))}
            </div>
          )
        ) : null}

        {showPerformanceGoals ? (
        <section className="border-t border-border pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-primary">{t('goals.performanceTitle')}</h2>
              <p className="text-sm text-muted">{t('goals.performanceSubtitle')}</p>
            </div>
            {!isSharedView && !canModifyYear ? (
              <p className="text-sm text-muted">{t('goals.readOnlyYear', { year: yearFilter })}</p>
            ) : !isSharedView && canModifyYear ? (
              <Link
                to="/objetivos/performance/novo"
                className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                {t('goals.newPerformance')}
              </Link>
            ) : null}
          </div>

          {isSharedView ? null : performanceLoading ? (
            <div className="mt-4">
              <GoalsSkeleton />
            </div>
          ) : performanceGoals.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border bg-surface p-8 text-center">
              <p className="text-lg font-semibold text-foreground">
                {isSharedView
                  ? t('voice.empty.shared.performanceGoals.title')
                  : t('voice.empty.own.performanceGoals.title', { year: yearFilter })}
              </p>
              {isSharedView ? (
                <p className="mt-2 text-muted">
                  {t('voice.empty.shared.performanceGoals.hint', { name: activeOwner?.label ?? '' })}
                </p>
              ) : (
                <p className="mt-2 text-muted">{t('voice.empty.own.performanceGoals.hint')}</p>
              )}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {performanceGoals.map((goal) => (
                <PerformanceGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={
                    isSharedView
                      ? undefined
                      : (goalId) => navigate(`/objetivos/performance/${goalId}/editar`)
                  }
                  onDelete={isSharedView ? undefined : setPerformanceGoalToDelete}
                  showActions={!isSharedView && goal.year >= currentYear}
                />
              ))}
            </div>
          )}
        </section>
        ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={goalToDelete !== null}
        title={t('goals.deleteGoalTitle')}
        message={
          goalToDelete ? t('goals.deleteGoalMessage', { name: formatGoalLabel(goalToDelete) }) : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setGoalToDelete(null)}
        loading={deleting}
      />

      <ConfirmDialog
        open={performanceGoalToDelete !== null}
        title={t('goals.deletePerformanceTitle')}
        message={
          performanceGoalToDelete
            ? t('goals.deleteGoalMessage', { name: formatPerformanceGoalLabel(performanceGoalToDelete) })
            : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleConfirmDeletePerformance()}
        onCancel={() => setPerformanceGoalToDelete(null)}
        loading={deleting}
      />
    </PageShell>
  )
}
