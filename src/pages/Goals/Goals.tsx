import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import medalha from '../../../assets/medalha.svg'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { FilterBar, FilterGroup, FilterPill } from '../../components/FilterBar'
import { GoalBoardCard } from '../../components/GoalBoardCard'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useGoals } from '../../hooks/useGoals'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { useSharedGoals } from '../../hooks/useSharedGoals'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import { computeGoalsBoard, type GoalBoardEntry } from '../../utils/goalsBoard'

function GoalsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl bg-border/60" />
      ))}
    </div>
  )
}

function BoardSection({
  title,
  entries,
  celebrate = false,
  onEdit,
  onDelete,
}: {
  title: string
  entries: GoalBoardEntry[]
  /** Cumpridos ganham a mesma banda das conquistas no Início. */
  celebrate?: boolean
  onEdit?: (entry: GoalBoardEntry) => void
  onDelete?: (entry: GoalBoardEntry) => void
}) {
  if (entries.length === 0) return null

  const grid = (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <GoalBoardCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )

  if (!celebrate) {
    return (
      <section>
        <h2 className="font-display text-2xl tracking-wide text-foreground">{title}</h2>
        {grid}
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-primary/10 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <img src={medalha} alt="" aria-hidden className="h-6 w-auto object-contain" />
        <h2 className="font-display text-2xl tracking-wide text-foreground">{title}</h2>
      </div>
      {grid}
    </section>
  )
}

export function Goals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [entryToDelete, setEntryToDelete] = useState<GoalBoardEntry | null>(null)
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
  const loading = isSharedView ? sharedGoals.loading : ownGoals.loading || ownPerformanceGoals.loading
  const error = isSharedView ? sharedGoals.error : (ownGoals.error ?? ownPerformanceGoals.error)
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

  const board = useMemo(
    () =>
      computeGoalsBoard(showGoals ? goals : [], showPerformanceGoals ? performanceGoals : []),
    [goals, performanceGoals, showGoals, showPerformanceGoals],
  )

  const isEmpty =
    board.pending.length === 0 && board.done.length === 0 && board.failed.length === 0
  const editHandler = canModifyYear ? (entry: GoalBoardEntry) => navigate(entry.editPath) : undefined
  const deleteHandler = canModifyYear ? setEntryToDelete : undefined

  async function handleConfirmDelete() {
    if (!entryToDelete) return

    setDeleting(true)
    try {
      if (entryToDelete.kind === 'annual') {
        await ownGoals.removeGoal(entryToDelete.sourceId)
        setSuccessMessage(t('goals.goalDeleted', { name: entryToDelete.title }))
      } else {
        await ownPerformanceGoals.removePerformanceGoal(entryToDelete.sourceId)
        setSuccessMessage(t('goals.performanceDeleted', { name: entryToDelete.title }))
      }
      setEntryToDelete(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageShell title={t('goals.title')}>
      <p className="mt-2 text-sm text-muted">{t('goals.subtitle')}</p>

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
                message={t('shares.sharedGoalsBanner', { name: activeOwner?.label ?? '' })}
              />
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <FilterBar>
                <FilterGroup label={t('common.year')}>
                  {availableYears.map((year) => (
                    <FilterPill
                      key={year}
                      active={yearFilter === year}
                      onClick={() => setYearFilter(year)}
                    >
                      {year}
                    </FilterPill>
                  ))}
                </FilterGroup>
                {!isSharedView && !canModifyYear ? (
                  <p className="text-sm text-muted">{t('goals.readOnlyYear', { year: yearFilter })}</p>
                ) : null}
              </FilterBar>

              {canModifyYear ? (
                <Link
                  to="/objetivos/novo"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  {t('goals.newGoal')}
                </Link>
              ) : null}
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

            {loading ? (
              <GoalsSkeleton />
            ) : isEmpty ? (
              <div className="rounded-xl border border-border bg-surface p-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {isSharedView
                    ? t('voice.empty.shared.goals.title')
                    : t('voice.empty.own.goals.title', { year: yearFilter })}
                </p>
                <p className="mt-2 text-muted">
                  {isSharedView
                    ? t('voice.empty.shared.goals.hint', {
                        name: activeOwner?.label ?? '',
                        year: yearFilter,
                      })
                    : t('voice.empty.own.goals.hint')}{' '}
                  {isSharedView ? null : (
                    <span className="font-semibold text-accent">{t('common.letsGo')}</span>
                  )}
                </p>
              </div>
            ) : (
              <>
                <BoardSection
                  title={t('goals.doneTitle')}
                  entries={board.done}
                  celebrate
                  onEdit={editHandler}
                  onDelete={deleteHandler}
                />

                <BoardSection
                  title={t('goals.pendingTitle')}
                  entries={board.pending}
                  onEdit={editHandler}
                  onDelete={deleteHandler}
                />

                {board.pending.length === 0 && board.failed.length === 0 ? (
                  <p className="text-sm text-muted">{t('goals.allDone', { year: yearFilter })}</p>
                ) : null}

                <BoardSection
                  title={t('goals.failedTitle')}
                  entries={board.failed}
                  onEdit={editHandler}
                  onDelete={deleteHandler}
                />
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={entryToDelete !== null}
        title={
          entryToDelete?.kind === 'performance'
            ? t('goals.deletePerformanceTitle')
            : t('goals.deleteGoalTitle')
        }
        message={entryToDelete ? t('goals.deleteGoalMessage', { name: entryToDelete.title }) : ''}
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setEntryToDelete(null)}
        loading={deleting}
      />
    </PageShell>
  )
}
