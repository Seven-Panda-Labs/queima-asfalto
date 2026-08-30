import { lazy, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AnalysisSection } from '../../components/Analysis/AnalysisSection'
import { CareerTotals } from '../../components/Analysis/CareerTotals'
import { DataQualityNote } from '../../components/Analysis/DataQualityNote'
import { RacePredictor } from '../../components/Analysis/RacePredictor'
import { RecordProgression } from '../../components/Analysis/RecordProgression'
import { SeasonHeader } from '../../components/Analysis/SeasonHeader'
import { SeasonTable } from '../../components/Analysis/SeasonTable'
import { FilterBar, FilterGroup, FilterPill } from '../../components/FilterBar'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { ViewSwitcher } from '../../components/ViewSwitcher'
import { useEvents } from '../../hooks/useEvents'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { useSharedEvents } from '../../hooks/useSharedEvents'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { visibleDisciplines } from '../../domain/disciplinePreferences'
import { formatPerformanceGoalLabel } from '../../types/PerformanceGoal'
import { formatDatePt } from '../../utils/date'
import {
  buildActivityCalendar,
  computeActivityRhythm,
  computeCareerTotals,
} from '../../utils/analytics/activity'
import { computeDataQuality } from '../../utils/analytics/dataQuality'
import {
  buildEquivalentSeries,
  pickReferenceEventType,
  predictRaceTimes,
} from '../../utils/analytics/equivalence'
import { buildPercentileSeries, summarisePercentiles } from '../../utils/analytics/percentile'
import {
  computeIndexTrend,
  goalTargetIndex,
  projectGoal,
} from '../../utils/analytics/projection'
import { buildRecordProgressions } from '../../utils/analytics/records'
import { NOMINAL_DISTANCE_KM, toAnalysableResults } from '../../utils/analytics/results'
import {
  availableSeasons,
  buildCumulativeSeasons,
  compareSeasons,
  computeSeasonSummary,
} from '../../utils/analytics/season'
import { computeSeasonality } from '../../utils/analytics/seasonality'
import {
  ANALYSIS_HORIZONS,
  buildResultsListPath,
  buildResultsListSearchParams,
  parseResultsListSearchParams,
  type AnalysisHorizon,
  type ResultsListFilters,
} from '../../utils/eventNavigation'

const FormCurveChart = lazy(() =>
  import('../../components/Charts/FormCurveChart').then((module) => ({
    default: module.FormCurveChart,
  })),
)
const PercentileChart = lazy(() =>
  import('../../components/Charts/PercentileChart').then((module) => ({
    default: module.PercentileChart,
  })),
)
const CumulativeSeasonChart = lazy(() =>
  import('../../components/Charts/CumulativeSeasonChart').then((module) => ({
    default: module.CumulativeSeasonChart,
  })),
)
const SeasonalityChart = lazy(() =>
  import('../../components/Charts/SeasonalityChart').then((module) => ({
    default: module.SeasonalityChart,
  })),
)
const PaceChart = lazy(() =>
  import('../../components/Charts/PaceChart').then((module) => ({ default: module.PaceChart })),
)
const ActivityHeatmap = lazy(() =>
  import('../../components/Analysis/ActivityHeatmap').then((module) => ({
    default: module.ActivityHeatmap,
  })),
)

/** Most people have well under ten results, so a block that draws itself from two points is a claim without evidence. */
const MIN_CURVE_POINTS = 3
const MIN_PERCENTILE_POINTS = 3
const MIN_SEASONS = 2
const MIN_SEASONALITY_MONTHS = 8
const MIN_HEATMAP_RACES = 4

function ChartSkeleton() {
  return <div className="h-56 animate-pulse rounded-xl bg-border/60 sm:h-64" aria-hidden />
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-24 animate-pulse rounded-xl bg-border/60" />
      <div className="h-56 animate-pulse rounded-xl bg-border/60" />
    </div>
  )
}

export function Results() {
  const { t, i18n } = useTranslation()
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
  const { horizon, year: yearFilter, type: eventTypeFilter } = filters
  const returnTo = buildResultsListPath(filters, currentYear, activeOwnerId)

  const ownEvents = useEvents()
  const sharedEvents = useSharedEvents(activeOwnerId)
  // The user's own goals; a shared snapshot does not carry them.
  const { goals: performanceGoals } = usePerformanceGoals()

  const allEvents = isSharedView ? sharedEvents.events : ownEvents.allEvents
  const loading = isSharedView ? sharedEvents.loading : ownEvents.loading
  const error = isSharedView ? sharedEvents.error : ownEvents.error
  const resultsHidden = activeOwner?.permissions.events === 'read_no_results'

  function updateFilters(patch: Partial<ResultsListFilters>) {
    const next = { ...filters, ...patch }
    const params = buildResultsListSearchParams(next, currentYear)
    if (activeOwnerId) params.set('owner', activeOwnerId)
    setSearchParams(params, { replace: true })
  }

  const allResults = useMemo(() => toAnalysableResults(allEvents), [allEvents])

  const results = useMemo(
    () =>
      eventTypeFilter === 'all'
        ? allResults
        : allResults.filter((result) => result.eventType === eventTypeFilter),
    [allResults, eventTypeFilter],
  )

  const { enabledDisciplines } = useDisciplines()

  /** Only the enabled disciplines, plus whichever one is filtering right now:
   *  a bookmark into a disabled discipline would otherwise narrow the page with
   *  no pill on screen to say so, and no way to clear it. */
  const disciplineOptions = useMemo(
    () =>
      visibleDisciplines(enabledDisciplines, eventTypeFilter === 'all' ? [] : [eventTypeFilter]),
    [enabledDisciplines, eventTypeFilter],
  )

  const seasons = useMemo(() => availableSeasons(allResults), [allResults])
  const season = typeof yearFilter === 'number' ? yearFilter : currentYear

  const referenceEventType = useMemo(() => pickReferenceEventType(results), [results])
  const referenceKm = referenceEventType ? NOMINAL_DISTANCE_KM[referenceEventType] : 10

  /** Always measured against the all-time best: normalising within a season
   *  would put a 100 in every year and stop seasons comparing. */
  const series = useMemo(
    () => buildEquivalentSeries(results, referenceKm),
    [results, referenceKm],
  )
  const seasonSeries = useMemo(
    () => series.filter((point) => point.result.year === season),
    [series, season],
  )
  const bestEquivalent = useMemo(
    () => (series.length > 0 ? Math.min(...series.map((point) => point.equivalentSeconds)) : null),
    [series],
  )

  const comparison = useMemo(() => compareSeasons(results, season), [results, season])
  const seasonSummaries = useMemo(
    () => seasons.map((year) => computeSeasonSummary(results, year)),
    [results, seasons],
  )
  const cumulative = useMemo(() => buildCumulativeSeasons(results), [results])
  const seasonality = useMemo(
    () => computeSeasonality(results, referenceKm),
    [results, referenceKm],
  )

  const percentiles = useMemo(() => buildPercentileSeries(results), [results])
  const seasonPercentiles = useMemo(
    () => percentiles.filter((point) => point.result.year === season),
    [percentiles, season],
  )
  const percentileSummary = useMemo(() => summarisePercentiles(percentiles), [percentiles])

  const progressions = useMemo(() => buildRecordProgressions(results), [results])
  const careerTotals = useMemo(() => computeCareerTotals(results), [results])
  const rhythm = useMemo(() => computeActivityRhythm(results), [results])
  const calendar = useMemo(() => buildActivityCalendar(results), [results])
  /** An estimate for a discipline the user does not race is noise, so the
   *  predictor follows the same visible set as the filters. */
  const forecast = useMemo(() => {
    const forecasted = predictRaceTimes(results, referenceKm)
    if (!forecasted) return null

    const predictions = forecasted.predictions.filter((prediction) =>
      enabledDisciplines.includes(prediction.eventType),
    )
    return predictions.length > 0 ? { ...forecasted, predictions } : null
  }, [results, referenceKm, enabledDisciplines])
  const quality = useMemo(() => computeDataQuality(allEvents), [allEvents])

  /** The pace chart works on events, not on analysed results. */
  const seasonEvents = useMemo(
    () => allEvents.filter((event) => event.date.getFullYear() === season),
    [allEvents, season],
  )

  const trend = useMemo(() => computeIndexTrend(series), [series])
  const seasonTrend = useMemo(() => computeIndexTrend(seasonSeries), [seasonSeries])

  /** These were lines on the curve. Three indistinguishable orange dashes said
   *  less than the sentence now sitting below the chart. */
  const goalTargets = useMemo(() => {
    if (isSharedView || bestEquivalent === null) return []

    return performanceGoals
      .filter((goal) => goal.year === season)
      .filter((goal) => eventTypeFilter === 'all' || goal.eventType === eventTypeFilter)
      .map((goal) => {
        const index = goalTargetIndex(goal, referenceKm, bestEquivalent)
        return index === null
          ? null
          : { id: goal.id, label: formatPerformanceGoalLabel(goal), index, goal }
      })
      .filter((line): line is NonNullable<typeof line> => line !== null)
  }, [
    isSharedView,
    performanceGoals,
    season,
    eventTypeFilter,
    referenceKm,
    bestEquivalent,
  ])

  const projections = useMemo(() => {
    if (!trend) return []
    return goalTargets
      .map((target) => projectGoal(target.goal, trend, target.index))
      .filter((projection) => projection.reachedOn !== null)
  }, [goalTargets, trend])

  const referenceLabel = referenceEventType
    ? formatEventTypeLabel(referenceEventType)
    : formatEventTypeLabel('km_10')

  const hasAnyResult = allResults.length > 0

  const horizonOptions = ANALYSIS_HORIZONS.map((value) => ({
    value,
    label: t(`analysis.horizon.${value}`),
  }))

  return (
    <PageShell title={t('results.title')}>
      <p className="mt-2 text-sm text-muted">{t('results.subtitle')}</p>

      <div className="mt-6 flex flex-col gap-8">
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
                message={t('shares.sharedResultsBanner', { name: activeOwner?.label ?? '' })}
              />
            ) : null}

            <div className="flex flex-col gap-4">
              <ViewSwitcher
                options={horizonOptions}
                value={horizon}
                onChange={(value: AnalysisHorizon) => updateFilters({ horizon: value })}
                label={t('analysis.horizonLabel')}
                as="tablist"
              />

              <FilterBar>
                {horizon === 'epoca' && seasons.length > 0 ? (
                  <FilterGroup label={t('common.year')}>
                    {seasons.map((value) => (
                      <FilterPill
                        key={value}
                        active={season === value}
                        onClick={() => updateFilters({ year: value })}
                      >
                        {value}
                      </FilterPill>
                    ))}
                  </FilterGroup>
                ) : null}

                <FilterGroup label={t('bucketList.discipline')}>
                  <FilterPill
                    active={eventTypeFilter === 'all'}
                    onClick={() => updateFilters({ type: 'all' })}
                  >
                    {t('bucketList.allDisciplines')}
                  </FilterPill>
                  {disciplineOptions.map((type) => (
                    <FilterPill
                      key={type}
                      active={eventTypeFilter === type}
                      onClick={() => updateFilters({ type })}
                    >
                      {formatEventTypeLabel(type)}
                    </FilterPill>
                  ))}
                </FilterGroup>
              </FilterBar>
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            {loading && !isSharedView ? (
              <AnalysisSkeleton />
            ) : resultsHidden ? (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {t('analysis.sharedNoResultsTitle')}
                </p>
                <p className="mt-2 text-muted">
                  {t('analysis.sharedNoResultsHint', { name: activeOwner?.label ?? '' })}
                </p>
              </div>
            ) : !hasAnyResult ? (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {isSharedView
                    ? t('voice.empty.shared.results.title')
                    : t('voice.empty.own.results.title')}
                </p>
                <p className="mt-2 text-muted">
                  {isSharedView
                    ? t('voice.empty.shared.results.hint', { name: activeOwner?.label ?? '' })
                    : t('voice.empty.own.results.hint')}
                </p>
              </div>
            ) : (
              <>
                {horizon === 'epoca' ? (
                  <>
                    <AnalysisSection
                      title={t('analysis.seasonTitle', { year: season })}
                      hint={t('analysis.seasonHint')}
                      empty={
                        comparison.current.races === 0
                          ? t('analysis.seasonEmpty', { year: season })
                          : undefined
                      }
                    >
                      <SeasonHeader comparison={comparison} />
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.formTitle')}
                      hint={t('analysis.formHint', { distance: referenceLabel })}
                      empty={
                        seasonSeries.length < MIN_CURVE_POINTS
                          ? t('analysis.formEmpty', { count: MIN_CURVE_POINTS })
                          : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <FormCurveChart
                            points={seasonSeries}
                            referenceLabel={referenceLabel}
                            trend={seasonTrend}
                          />
                        </Suspense>
                        {projections.length > 0 ? (
                          <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-muted">
                            {projections.map((projection) => (
                              <li key={projection.goal.id}>
                                {t('analysis.projection', {
                                  goal: formatPerformanceGoalLabel(projection.goal),
                                  date: formatDatePt(projection.reachedOn!),
                                })}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </AnalysisSection>

                    <AnalysisSection
                      title={
                        eventTypeFilter === 'all'
                          ? t('results.chartTitleAll')
                          : t('results.chartTitle', {
                              type: formatEventTypeLabel(eventTypeFilter),
                            })
                      }
                      hint={t('analysis.paceHint')}
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <PaceChart events={seasonEvents} eventType={eventTypeFilter} />
                        </Suspense>
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
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.percentileTitle')}
                      hint={t('analysis.percentileHint')}
                      empty={
                        seasonPercentiles.length < MIN_PERCENTILE_POINTS
                          ? t('analysis.percentileEmpty', { count: MIN_PERCENTILE_POINTS })
                          : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <PercentileChart points={seasonPercentiles} />
                        </Suspense>
                      </div>
                    </AnalysisSection>
                  </>
                ) : null}

                {horizon === 'epocas' ? (
                  <>
                    <AnalysisSection
                      title={t('analysis.cumulativeTitle')}
                      hint={t('analysis.cumulativeHint')}
                      empty={
                        cumulative.length < MIN_SEASONS
                          ? t('analysis.needsTwoSeasons')
                          : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <CumulativeSeasonChart seasons={cumulative} />
                        </Suspense>
                      </div>
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.seasonTableTitle')}
                      hint={t('analysis.seasonTableHint')}
                      empty={
                        seasonSummaries.length < MIN_SEASONS
                          ? t('analysis.needsTwoSeasons')
                          : undefined
                      }
                    >
                      <SeasonTable seasons={seasonSummaries} />
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.seasonalityTitle')}
                      hint={t('analysis.seasonalityHint')}
                      empty={
                        seasonality.coveredMonths < MIN_SEASONALITY_MONTHS
                          ? t('analysis.seasonalityEmpty', { count: MIN_SEASONALITY_MONTHS })
                          : undefined
                      }
                      aside={
                        seasonality.bestMonth && seasonality.coveredMonths >= MIN_SEASONALITY_MONTHS
                          ? (
                              <p className="text-sm text-muted">
                                {t('analysis.seasonalityBest', {
                                  month: new Intl.DateTimeFormat(i18n.language, {
                                    month: 'long',
                                  }).format(new Date(2026, seasonality.bestMonth.month, 1)),
                                })}
                              </p>
                            )
                          : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <SeasonalityChart seasonality={seasonality} />
                        </Suspense>
                      </div>
                    </AnalysisSection>
                  </>
                ) : null}

                {horizon === 'sempre' ? (
                  <>
                    <AnalysisSection
                      title={t('analysis.careerTitle')}
                      hint={t('analysis.careerHint')}
                    >
                      {careerTotals ? (
                        <CareerTotals totals={careerTotals} rhythm={rhythm} />
                      ) : null}
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.formTitle')}
                      hint={t('analysis.formHint', { distance: referenceLabel })}
                      empty={
                        series.length < MIN_CURVE_POINTS
                          ? t('analysis.formEmpty', { count: MIN_CURVE_POINTS })
                          : undefined
                      }
                      aside={
                        trend ? (
                          <p className="text-sm text-muted">
                            {t('analysis.trendSummary', {
                              change: trend.yearlyChange.toFixed(1),
                            })}
                          </p>
                        ) : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <FormCurveChart
                            points={series}
                            referenceLabel={referenceLabel}
                            trend={trend}
                          />
                        </Suspense>
                      </div>
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.recordsTitle')}
                      hint={t('analysis.recordsHint')}
                      empty={progressions.length === 0 ? t('analysis.recordsEmpty') : undefined}
                    >
                      <RecordProgression
                        progressions={progressions}
                        returnTo={returnTo}
                        ownerId={activeOwnerId}
                      />
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.percentileTitle')}
                      hint={t('analysis.percentileHint')}
                      empty={
                        percentiles.length < MIN_PERCENTILE_POINTS
                          ? t('analysis.percentileEmpty', { count: MIN_PERCENTILE_POINTS })
                          : undefined
                      }
                      aside={
                        percentileSummary ? (
                          <p className="text-sm text-muted">
                            {t('analysis.percentileBest', {
                              percent: percentileSummary.bestTopPercent,
                            })}
                          </p>
                        ) : undefined
                      }
                    >
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Suspense fallback={<ChartSkeleton />}>
                          <PercentileChart points={percentiles} />
                        </Suspense>
                      </div>
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.predictorTitle')}
                      hint={t('analysis.predictorHint')}
                      empty={forecast === null ? t('analysis.predictorEmpty') : undefined}
                    >
                      {forecast ? <RacePredictor forecast={forecast} /> : null}
                    </AnalysisSection>

                    <AnalysisSection
                      title={t('analysis.heatmapTitle')}
                      hint={t('analysis.heatmapHint')}
                      empty={
                        results.length < MIN_HEATMAP_RACES
                          ? t('analysis.heatmapEmpty', { count: MIN_HEATMAP_RACES })
                          : undefined
                      }
                    >
                      <Suspense fallback={<ChartSkeleton />}>
                        <ActivityHeatmap calendar={calendar} />
                      </Suspense>
                    </AnalysisSection>
                  </>
                ) : null}

                <DataQualityNote
                  quality={quality}
                  returnTo={returnTo}
                  ownerId={activeOwnerId}
                  readOnly={isSharedView}
                />
              </>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
