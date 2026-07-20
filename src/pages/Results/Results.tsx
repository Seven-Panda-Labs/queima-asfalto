import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { PaceChart } from '../../components/Charts/PaceChart'
import {
  PersonalRecordIndicator,
  personalRecordRowClass,
} from '../../components/PersonalRecordIndicator/PersonalRecordIndicator'
import { VerifiedResultIndicator } from '../../components/VerifiedResultIndicator/VerifiedResultIndicator'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useEvents } from '../../hooks/useEvents'
import { useSharedEvents } from '../../hooks/useSharedEvents'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import { EVENT_TYPES } from '../../types/Event'
import { formatEventTypeLabel } from '../../types/Goal'
import { formatClassificationDisplay } from '../../utils/classification'
import { formatDatePt } from '../../utils/date'
import { getPersonalRecordIds } from '../../utils/bestPerformances'
import {
  buildEventDetailPath,
  buildResultsListPath,
  buildResultsListSearchParams,
  eventLinkState,
  parseResultsListSearchParams,
  type ResultsListFilters,
} from '../../utils/eventNavigation'

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

function ResultsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  )
}

export function Results() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    tabs: ownerTabs,
    activeOwnerId,
    activeOwner,
    isSharedView,
    setActiveOwnerId,
  } = useSharedOwnerTabs('results', 'shares.resultsTabMine')
  const filters = parseResultsListSearchParams(searchParams, currentYear)
  const { year: yearFilter, type: eventTypeFilter } = filters
  const returnTo = buildResultsListPath(filters, currentYear, activeOwnerId)
  const ownEvents = useEvents()
  const sharedEvents = useSharedEvents(activeOwnerId)

  const allEvents = isSharedView ? sharedEvents.events : ownEvents.allEvents
  const loading = isSharedView ? sharedEvents.loading : ownEvents.loading
  const error = isSharedView ? sharedEvents.error : ownEvents.error

  function updateFilters(patch: Partial<ResultsListFilters>) {
    const next = { ...filters, ...patch }
    const params = buildResultsListSearchParams(next, currentYear)
    if (activeOwnerId) params.set('owner', activeOwnerId)
    setSearchParams(params, { replace: true })
  }

  const hasAnyCompleted = useMemo(
    () => allEvents.some((event) => event.status === 'completed' && event.time && event.pace),
    [allEvents],
  )

  const yearFilteredCompleted = useMemo(() => {
    return allEvents
      .filter(
        (event) =>
          event.status === 'completed' &&
          event.time &&
          event.pace &&
          (yearFilter === 'all' || event.date.getFullYear() === yearFilter),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [allEvents, yearFilter])

  const completedEvents = useMemo(() => {
    if (eventTypeFilter === 'all') return yearFilteredCompleted
    return yearFilteredCompleted.filter((event) => event.eventType === eventTypeFilter)
  }, [yearFilteredCompleted, eventTypeFilter])

  const availableYears = useMemo(() => {
    const years = new Set(
      allEvents
        .filter((event) => event.status === 'completed')
        .map((event) => event.date.getFullYear()),
    )
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [allEvents, currentYear])

  const personalRecordIds = useMemo(
    () => (isSharedView ? new Set<string>() : getPersonalRecordIds(allEvents)),
    [allEvents, isSharedView],
  )

  const chartEvents = useMemo(() => {
    if (yearFilter === 'all') return allEvents
    return allEvents.filter((event) => event.date.getFullYear() === yearFilter)
  }, [allEvents, yearFilter])

  return (
    <PageShell title={t('results.title')}>
      <div className="mt-6 flex flex-col gap-6">
        <SharedOwnerTabs
          tabs={ownerTabs}
          activeOwnerId={activeOwnerId}
          onChange={setActiveOwnerId}
          ariaLabelKey="shares.resultsTabsLabel"
        />

        {isSharedView && loading ? (
          <SharedDataLoading section="results" ownerName={activeOwner?.label ?? ''} />
        ) : (
          <>
        {isSharedView ? (
          <SharedContextBanner
            message={t('shares.sharedResultsBanner', {
              name: activeOwner?.label ?? '',
            })}
          />
        ) : null}

        <p className="text-muted">{t('results.subtitle')}</p>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{t('common.year')}</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={yearFilter === 'all'} onClick={() => updateFilters({ year: 'all' })}>
              {t('common.all')}
            </FilterButton>
            {availableYears.map((year) => (
              <FilterButton
                key={year}
                active={yearFilter === year}
                onClick={() => updateFilters({ year })}
              >
                {year}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{t('bucketList.discipline')}</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={eventTypeFilter === 'all'}
              onClick={() => updateFilters({ type: 'all' })}
            >
              {t('bucketList.allDisciplines')}
            </FilterButton>
            {EVENT_TYPES.map((type) => (
              <FilterButton
                key={type}
                active={eventTypeFilter === type}
                onClick={() => updateFilters({ type })}
              >
                {formatEventTypeLabel(type)}
              </FilterButton>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {loading && !isSharedView ? (
          <ResultsSkeleton />
        ) : !hasAnyCompleted ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">
              {isSharedView ? t('voice.empty.shared.results.title') : t('voice.empty.own.results.title')}
            </p>
            {isSharedView ? (
              <p className="mt-2 text-muted">
                {t('voice.empty.shared.results.hint', { name: activeOwner?.label ?? '' })}
              </p>
            ) : (
              <p className="mt-2 text-muted">{t('voice.empty.own.results.hint')}</p>
            )}
          </div>
        ) : completedEvents.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">{t('results.noFilterMatch')}</p>
            <p className="mt-2 text-muted">{t('results.noFilterHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
                  <th className="px-4 py-3 font-semibold">{t('eventDetail.title')}</th>
                  <th className="px-4 py-3 font-semibold">{t('results.realDistance')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.time')}</th>
                  <th className="px-4 py-3 font-semibold">{t('results.paceHeader')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.classification')}</th>
                </tr>
              </thead>
              <tbody>
                {completedEvents.map((event) => {
                  const isRecord = personalRecordIds.has(event.id)

                  return (
                  <tr
                    key={event.id}
                    className={[
                      'border-b border-border last:border-b-0',
                      personalRecordRowClass(isRecord),
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{formatDatePt(event.date)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={buildEventDetailPath(event.id, { ownerId: activeOwnerId, returnTo })}
                        state={eventLinkState(returnTo).state}
                        className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                      >
                        {!isSharedView && isRecord ? <PersonalRecordIndicator /> : null}
                        {event.emoji ? <span aria-hidden>{event.emoji}</span> : null}
                        <span>{event.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{event.realDistance} Km</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {event.time}
                        {event.resultsVerified ? <VerifiedResultIndicator /> : null}
                      </span>
                    </td>
                    <td
                      className={[
                        'px-4 py-3 whitespace-nowrap',
                        isRecord ? 'font-semibold text-accent' : '',
                      ].join(' ')}
                    >
                      {event.pace}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {event.classification
                        ? formatClassificationDisplay(event.classification)
                        : t('common.dash')}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && hasAnyCompleted ? (
          <section id="grafico" className="scroll-mt-4">
            <h2 className="text-lg font-semibold text-foreground">
              {eventTypeFilter === 'all'
                ? t('results.chartTitleAll')
                : t('results.chartTitle', { type: formatEventTypeLabel(eventTypeFilter) })}
            </h2>
            <div className="mt-4 rounded-lg border border-border bg-surface p-4">
              <PaceChart events={chartEvents} eventType={eventTypeFilter} />
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success" aria-hidden />
                  {t('results.legendFaster')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-accent" aria-hidden />
                  {t('results.legendAverage')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-danger" aria-hidden />
                  {t('results.legendSlower')}
                </span>
              </div>
            </div>
          </section>
        ) : null}
          </>
        )}
      </div>
    </PageShell>
  )
}
