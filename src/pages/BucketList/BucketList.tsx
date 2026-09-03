import { lazy, Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { FilterBar, FilterGroup, FilterPill } from '../../components/FilterBar'
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
} from '../../components/icons/actionIcons'
import { PageShell } from '../../components/PageShell/PageShell'
import { ViewSwitcher } from '../../components/ViewSwitcher'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { ScheduleDisciplineDialog } from '../../components/ScheduleDisciplineDialog/ScheduleDisciplineDialog'
import { useAuth } from '../../contexts/AuthContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import { useRaces } from '../../hooks/useRaces'
import { useRaceEntries } from '../../hooks/useRaceEntries'
import { useRaceEntryRollover } from '../../hooks/useRaceEntryRollover'
import { buildRaceEntryFunnel } from '../../domain/raceEntryFunnel'
import { anyAnchorRaceIds } from '../../domain/seasonAnchors'
import { buildSeasonBoard } from '../../domain/seasonBoard'
import { BucketListFunnel } from './BucketListFunnel'
import { useSharedBucketList } from '../../hooks/useSharedBucketList'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import type { BucketListItem } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { visibleDisciplines } from '../../domain/disciplinePreferences'
import { bucketListItemHasDiscipline } from '../../utils/bucketListDisciplines'
import {
  bucketListItemsWithCoordinates,
  bucketListItemsWithoutCoordinates,
} from '../../utils/bucketListMap'
import {
  getBucketListViewMode,
  setBucketListViewMode,
  type BucketListViewMode,
} from '../../utils/bucketListViewMode'
import {
  formatTargetMonth,
  TARGET_MONTHS,
  targetMonthSortIndex,
  type TargetMonth,
} from '../../utils/targetMonth'

const BucketListMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.BucketListMap })),
)
const UnmappedBucketListPanel = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.UnmappedBucketListPanel })),
)

export type EventFormFromBucketListState = {
  fromBucketList: {
    bucketListItemId: string
    raceId?: string
    name: string
    location: string
    locationLat?: number
    locationLng?: number
    realDistance: number
    eventType: EventType
    emoji?: string
    notes?: string
  }
}

function BucketListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  )
}

export function BucketList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    tabs: ownerTabs,
    activeOwnerId,
    activeOwner,
    isSharedView,
    setActiveOwnerId,
  } = useSharedOwnerTabs('bucketList', 'shares.bucketListTabMine')
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | 'all'>('all')
  const [monthFilter, setMonthFilter] = useState<TargetMonth | 'all'>('all')
  const [viewMode, setViewMode] = useState<BucketListViewMode>(() => getBucketListViewMode(user?.uid))
  const [itemToDelete, setItemToDelete] = useState<BucketListItem | null>(null)
  const [itemToSchedule, setItemToSchedule] = useState<BucketListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const ownBucketList = useBucketList()
  const { entries: raceEntries, loading: entriesLoading, addEntry } = useRaceEntries()
  /** Only to know which races failed: the reason lives on the event. */
  const { allEvents } = useEvents()
  /** Anchors live on the race, so a scheduled or directly created one counts. */
  const { races } = useRaces()
  const anchorIds = useMemo(() => anyAnchorRaceIds(races), [races])
  const sharedBucketList = useSharedBucketList(activeOwnerId)

  // Only for the account's own list: rolling over somebody else's wishes is not
  // this page's business.
  useRaceEntryRollover(
    isSharedView ? [] : ownBucketList.items,
    raceEntries,
    ownBucketList.loading || entriesLoading,
    addEntry,
  )

  const items = isSharedView ? sharedBucketList.items : ownBucketList.items
  const loading = isSharedView ? sharedBucketList.loading : ownBucketList.loading
  const error = isSharedView ? sharedBucketList.error : ownBucketList.error
  const removeItem = isSharedView ? sharedBucketList.removeItem : ownBucketList.removeItem
  const canWrite = !isSharedView || activeOwner?.permissions.bucketList === 'write'

  const addItemPath = activeOwnerId
    ? `/bucket-list/novo?owner=${activeOwnerId}`
    : '/bucket-list/novo'

  const { enabledDisciplines } = useDisciplines()

  /** Only the enabled disciplines, plus whichever one is filtering right now:
   *  a link into a disabled discipline would otherwise narrow the list with no
   *  pill on screen to say so, and no way to clear it. */
  const disciplineOptions = useMemo(
    () =>
      visibleDisciplines(enabledDisciplines, eventTypeFilter === 'all' ? [] : [eventTypeFilter]),
    [enabledDisciplines, eventTypeFilter],
  )

  const availableMonths = useMemo(() => {
    const months = new Set<TargetMonth>()
    for (const item of items) {
      if (item.targetMonth && TARGET_MONTHS.includes(item.targetMonth as TargetMonth)) {
        months.add(item.targetMonth as TargetMonth)
      }
    }
    return TARGET_MONTHS.filter((month) => months.has(month))
  }, [items])

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (eventTypeFilter !== 'all' && !bucketListItemHasDiscipline(item, eventTypeFilter)) {
          return false
        }
        if (monthFilter !== 'all' && item.targetMonth !== monthFilter) return false
        return true
      })
      .sort((a, b) => {
        const monthDiff = targetMonthSortIndex(a.targetMonth) - targetMonthSortIndex(b.targetMonth)
        if (monthDiff !== 0) return monthDiff
        return a.name.localeCompare(b.name, 'pt')
      })
  }, [items, eventTypeFilter, monthFilter])

  // A shared view carries no entries: the snapshot does not include them, so
  // every row lands in the group for a race nobody has acted on yet.
  const funnelGroups = useMemo(
    () =>
      buildRaceEntryFunnel(
        filteredItems,
        isSharedView ? [] : raceEntries,
        undefined,
        anchorIds,
      ),
    [anchorIds, filteredItems, isSharedView, raceEntries],
  )

  /**
   * The season, as the rules can read it: the races that have a date.
   *
   * A wish with only a target month is not on the calendar yet, so no rule can
   * say anything about it. The id is the race identity when there is one, because
   * that is what an anchor is pointed at by.
   */
  /**
   * The season, read off the calendar.
   *
   * Keyed by race identity because that is what a wish, an entry and an event
   * all point at: a race that has been scheduled keeps its window and its
   * warnings, which it lost when this was built from wishes.
   */
  const season = useMemo(
    () =>
      buildSeasonBoard({
        races,
        entries: raceEntries,
        events: allEvents,
        items: ownBucketList.items,
      }).byRaceId,
    [allEvents, ownBucketList.items, raceEntries, races],
  )

  const mappedItems = useMemo(() => bucketListItemsWithCoordinates(filteredItems), [filteredItems])
  const unmappedItems = useMemo(
    () => bucketListItemsWithoutCoordinates(filteredItems),
    [filteredItems],
  )

  function handleViewModeChange(mode: BucketListViewMode) {
    setViewMode(mode)
    setBucketListViewMode(mode, user?.uid)
  }

  async function handleConfirmDelete() {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      await removeItem(itemToDelete.id)
      setSuccessMessage(t('bucketList.deleted', { name: itemToDelete.name }))
      setItemToDelete(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setDeleting(false)
    }
  }

  function navigateToSchedule(item: BucketListItem, eventType: EventType) {
    const state: EventFormFromBucketListState = {
      fromBucketList: {
        bucketListItemId: item.id,
        raceId: item.raceId,
        name: item.name,
        location: item.location,
        locationLat: item.locationLat,
        locationLng: item.locationLng,
        realDistance: item.realDistance,
        eventType,
        emoji: item.emoji,
        notes: item.notes,
      },
    }
    navigate('/eventos/novo', { state })
  }

  function handleSchedule(item: BucketListItem) {
    if (item.disciplines.length === 1) {
      navigateToSchedule(item, item.disciplines[0]!)
      return
    }
    setItemToSchedule(item)
  }

  function handleConfirmScheduleDiscipline(eventType: EventType) {
    if (!itemToSchedule) return
    navigateToSchedule(itemToSchedule, eventType)
    setItemToSchedule(null)
  }

  return (
    <PageShell title={t('bucketList.title')}>
      <p className="mt-2 text-sm text-muted">{t('bucketList.subtitle')}</p>

      <div className="mt-6 flex flex-col gap-6">
        <SharedOwnerTabs
          tabs={ownerTabs}
          activeOwnerId={activeOwnerId}
          onChange={setActiveOwnerId}
          ariaLabelKey="shares.bucketListTabsLabel"
        />

        {isSharedView && loading ? (
          <SharedDataLoading section="bucketList" ownerName={activeOwner?.label ?? ''} />
        ) : (
          <>
        {isSharedView ? (
          <SharedContextBanner
            message={t('shares.sharedBucketListBanner', {
              name: activeOwner?.label ?? '',
            })}
          />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ViewSwitcher
            options={[
              { value: 'lista', label: t('viewMode.list') },
              { value: 'mapa', label: t('viewMode.map') },
            ]}
            value={viewMode}
            onChange={handleViewModeChange}
            label={t('viewMode.label')}
          />
          {canWrite && !isSharedView ? (
            <Link
              to="/bucket-list/descobrir"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t('findRaces.cta')}
            </Link>
          ) : null}
          {canWrite ? (
            <Link
              to={addItemPath}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t('common.add')}
            </Link>
          ) : null}
        </div>

        {items.length > 0 ? (
          <>
            <FilterBar>
              <FilterGroup label={t('bucketList.discipline')}>
                <FilterPill
                  active={eventTypeFilter === 'all'}
                  onClick={() => setEventTypeFilter('all')}
                >
                  {t('bucketList.allDisciplines')}
                </FilterPill>
                {disciplineOptions.map((type) => (
                  <FilterPill
                    key={type}
                    active={eventTypeFilter === type}
                    onClick={() => setEventTypeFilter(type)}
                  >
                    {formatEventTypeLabel(type)}
                  </FilterPill>
                ))}
              </FilterGroup>

              {availableMonths.length > 0 ? (
                <FilterGroup label={t('bucketList.targetMonthFilter')}>
                  <FilterPill active={monthFilter === 'all'} onClick={() => setMonthFilter('all')}>
                    {t('common.all')}
                  </FilterPill>
                  {availableMonths.map((month) => (
                    <FilterPill
                      key={month}
                      active={monthFilter === month}
                      onClick={() => setMonthFilter(month)}
                    >
                      {formatTargetMonth(month)}
                    </FilterPill>
                  ))}
                </FilterGroup>
              ) : null}
            </FilterBar>
          </>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

        {loading && !isSharedView ? (
          <BucketListSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">
              {isSharedView ? t('voice.empty.shared.bucketList.title') : t('voice.empty.own.bucketList.title')}
            </p>
            <p className="mt-2 text-muted">
              {isSharedView ? (
                t('voice.empty.shared.bucketList.hint', { name: activeOwner?.label ?? '' })
              ) : (
                <>
                  {t('voice.empty.own.bucketList.hint')}{' '}
                  <span className="font-semibold text-accent">{t('common.letsGo')}</span>
                </>
              )}
            </p>
            {canWrite ? (
              <Link
                to={addItemPath}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {t('bucketList.addFirst')}
              </Link>
            ) : null}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">{t('bucketList.noFilterMatch')}</p>
            <p className="mt-2 text-muted">{t('bucketList.noFilterHint')}</p>
          </div>
        ) : viewMode === 'mapa' ? (
          <div className="flex w-full flex-col gap-4">
            <Suspense fallback={<BucketListSkeleton />}>
              <BucketListMap items={mappedItems} className="w-full" />
            </Suspense>
            <Suspense fallback={null}>
              <UnmappedBucketListPanel items={unmappedItems} />
            </Suspense>
          </div>
        ) : (
          <BucketListFunnel
            groups={funnelGroups}
            season={isSharedView ? new Map() : season}
            anchorRaceIds={isSharedView ? new Set() : anchorIds}
            showEntryLink={!isSharedView}
            actions={({ item }) => (
              <>
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('common.open')}
                    title={t('common.open')}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
                  >
                    <ExternalLinkIcon />
                  </a>
                ) : null}
                {canWrite ? (
                  <>
                    <Link
                      to={
                        activeOwnerId
                          ? `/bucket-list/${item.id}/editar?owner=${activeOwnerId}`
                          : `/bucket-list/${item.id}/editar`
                      }
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
                    >
                      <PencilIcon />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                      className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-danger"
                    >
                      <TrashIcon />
                    </button>
                  </>
                ) : null}
                {!isSharedView ? (
                  <button
                    type="button"
                    onClick={() => handleSchedule(item)}
                    aria-label={t('common.schedule')}
                    title={t('common.schedule')}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
                  >
                    <CalendarPlusIcon />
                  </button>
                ) : null}
              </>
            )}
          />
        )}
          </>
        )}
      </div>

      <ScheduleDisciplineDialog
        open={itemToSchedule !== null}
        item={itemToSchedule}
        onCancel={() => setItemToSchedule(null)}
        onConfirm={handleConfirmScheduleDiscipline}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title={t('bucketList.deleteTitle')}
        message={
          itemToDelete ? t('bucketList.deleteMessage', { name: itemToDelete.name }) : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setItemToDelete(null)}
        loading={deleting}
      />
    </PageShell>
  )
}
