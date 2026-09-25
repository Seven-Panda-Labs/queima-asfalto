import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
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
import { ScheduleRaceDialog } from '../../components/ScheduleRaceDialog/ScheduleRaceDialog'
import { useAuth } from '../../contexts/AuthContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import { useRaces } from '../../hooks/useRaces'
import { prefillFromCatalog, type EntryPrefill } from '../../domain/entryPrefill'
import { wishPins, wishSubject } from '../../domain/wishSubject'
import { formatDatePt } from '../../utils/date'
import { NOMINAL_DISTANCE_KM } from '../../domain/eventCodes'
import { loadCatalogRace, loadCatalogRaces } from '../../services/raceCatalog'
import { wishesWithADate } from '../../domain/wishesWithADate'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { createEvent } from '../../services/events'
import { LinkWishesToCatalog } from '../../components/LinkWishesToCatalog'
import { useRaceEntries } from '../../hooks/useRaceEntries'
import { useRaceEntryRollover } from '../../hooks/useRaceEntryRollover'
import { anyAnchorRaceIds } from '../../domain/seasonAnchors'
import { buildSeasonBoard } from '../../domain/seasonBoard'
import { WishList } from './WishList'
import { SeasonTimeline } from '../../components/SeasonTimeline'
import { seasonYears } from '../../domain/seasonTimeline'
import { useSharedBucketList } from '../../hooks/useSharedBucketList'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import type { BucketListItem } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'
import {
  getBucketListViewMode,
  setBucketListViewMode,
  type BucketListViewMode,
} from '../../utils/bucketListViewMode'

const BucketListMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.BucketListMap })),
)
const UnmappedBucketListPanel = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.UnmappedBucketListPanel })),
)

function BucketListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  )
}

export function Planning() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    tabs: ownerTabs,
    activeOwnerId,
    activeOwner,
    isSharedView,
    setActiveOwnerId,
  } = useSharedOwnerTabs('bucketList', 'shares.bucketListTabMine')
  const [viewMode, setViewMode] = useState<BucketListViewMode>(() => getBucketListViewMode(user?.uid))
  const [itemToDelete, setItemToDelete] = useState<BucketListItem | null>(null)
  const [itemToSchedule, setItemToSchedule] = useState<BucketListItem | null>(null)
  /** What the catalog knows about the next running of the wish being scheduled. */
  const [offer, setOffer] = useState<EntryPrefill | null>(null)
  /** What that race is run over, which is the catalog's answer and not the wish's. */
  const [scheduleDisciplines, setScheduleDisciplines] = useState<EventType[]>([])
  /** The catalog behind the marked races, for the dates they may have gained. */
  const [markedEntries, setMarkedEntries] = useState<RaceCatalogEntry[]>([])
  const [loadingOffer, setLoadingOffer] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const ownBucketList = useBucketList()
  const { entries: raceEntries, loading: entriesLoading, addEntry } = useRaceEntries()
  /** Only to know which races failed: the reason lives on the event. */
  const { allEvents } = useEvents()
  /** Anchors live on the race, so a scheduled or directly created one counts. */
  const { races } = useRaces()
  const anchorIds = useMemo(() => anyAnchorRaceIds(races), [races])
  /** The season being planned, which is as often next year as this one. */
  const years = useMemo(() => seasonYears(allEvents), [allEvents])
  /**
   * In the address, like the events list, so it survives leaving the page.
   *
   * Going to the catalog to fill a gap in 2027 and coming back to 2026 is the
   * page forgetting the one thing the visit was about.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const seasonYear = Number(searchParams.get('year')) || new Date().getFullYear()
  const setSeasonYear = (year: number) => {
    const next = new URLSearchParams(searchParams)
    if (year === new Date().getFullYear()) next.delete('year')
    else next.set('year', String(year))
    setSearchParams(next, { replace: true })
  }
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


  /**
   * What the catalog says about the races on this list.
   *
   * One read per ten wishes, when the list changes. A wish is a marker, so
   * this is the only way to know that the edition it was waiting for has been
   * published.
   */
  const markedCatalogIds = useMemo(() => {
    const catalogByRaceId = new Map(
      races.filter((race) => race.catalogRaceId).map((race) => [race.id, race.catalogRaceId!]),
    )
    return [...new Set(items.map((item) => item.raceId && catalogByRaceId.get(item.raceId)))].filter(
      (id): id is string => Boolean(id),
    )
  }, [items, races])

  useEffect(() => {
    if (isSharedView || markedCatalogIds.length === 0) {
      setMarkedEntries([])
      return
    }
    void loadCatalogRaces(markedCatalogIds).then(setMarkedEntries)
  }, [isSharedView, markedCatalogIds])

  const dated = useMemo(
    () => wishesWithADate(items, races, markedEntries, seasonYear),
    [items, races, markedEntries, seasonYear],
  )

  /** By the race's name, because a marker has nothing else to sort by. */
  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) =>
        wishSubject(left, races).name.localeCompare(wishSubject(right, races).name, 'pt'),
      ),
    [items, races],
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

  // The place is the race's, so the map shows what the race identity knows.
  const pins = useMemo(
    () => wishPins(sortedItems, isSharedView ? [] : races),
    [sortedItems, isSharedView, races],
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

  /**
   * Opens the one step between a wish and the calendar.
   *
   * The catalog is read here rather than for the whole list: one document when
   * somebody asks to schedule, against five thousand on every visit.
   */
  async function handleSchedule(item: BucketListItem) {
    setItemToSchedule(item)
    setOffer(null)
    setScheduleDisciplines(item.disciplines ?? [])
    const catalogRaceId = races.find((race) => race.id === item.raceId)?.catalogRaceId
    if (!catalogRaceId) return
    setLoadingOffer(true)
    try {
      const entry = await loadCatalogRace(catalogRaceId)
      setOffer(prefillFromCatalog(entry))
      if (entry && entry.disciplines.length > 0) setScheduleDisciplines(entry.disciplines)
    } catch {
      setOffer(null)
    } finally {
      setLoadingOffer(false)
    }
  }

  /**
   * Writes the event and takes the wish off the list.
   *
   * Everything the old event form asked for is already here: the wish carries
   * the name, the place and the distance, and the only two answers worth a
   * question are which distance and which day. `planned` because a date in the
   * calendar is not an entry: saying "I am in" is the event's own state.
   */
  async function handleConfirmSchedule(eventType: EventType, day: string) {
    const item = itemToSchedule
    if (!item || !user) return
    setScheduling(true)
    try {
      const subject = wishSubject(item, races)
      await createEvent(user.uid, {
        name: subject.name,
        date: new Date(`${day}T12:00:00`),
        // The distance the discipline stands for. A wish carries none since it
        // became a marker, and the one it used to carry is the same number.
        realDistance: item.realDistance ?? NOMINAL_DISTANCE_KM[eventType],
        eventType,
        location: subject.location,
        locationLat: subject.locationLat,
        locationLng: subject.locationLng,
        status: 'planned',
        emoji: item.emoji,
        notes: item.notes,
        ...(item.raceId ? { raceId: item.raceId } : {}),
      })
      // The wish was "one day"; the day is now a date in the calendar.
      await removeItem(item.id)
      setItemToSchedule(null)
      setSuccessMessage(t('bucketList.scheduled', { name: item.name }))
    } catch {
      setSuccessMessage(null)
    } finally {
      setScheduling(false)
    }
  }

  return (
    <PageShell title={t('planning.title')}>
      <p className="mt-2 text-sm text-muted">{t('planning.subtitle')}</p>

      {/* The season first: the wishes below it are the answer to a gap in it,
          which is the order somebody plans in. A shared list is somebody
          else's wishes and carries no season of ours. */}
      {!isSharedView ? (
        <div className="mt-6">
          <SeasonTimeline
            events={allEvents}
            year={seasonYear}
            years={years}
            anchorRaceIds={anchorIds}
            onYear={setSeasonYear}
          />
          {/* The one thing this page is for, and it was a quiet link at the
              far end of a filter bar. */}
          <Link
            to={`/planeamento/descobrir?season=${seasonYear}`}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t('findRaces.cta')}
          </Link>
        </div>
      ) : null}

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

        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('planning.wishesTitle')}
        </h2>

        {/* A wish waits for its edition to be published, and that moment is a
            decision nobody was being told about. */}
        {dated.length > 0 ? (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {t('planning.datedTitle', { count: dated.length, year: seasonYear })}
            </p>
            <ul className="mt-2 space-y-1">
              {dated.map((row) => (
                <li key={row.item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{row.entry.name}</span>
                  <span className="text-xs tabular-nums text-muted">
                    {formatDatePt(new Date(`${row.raceDate}T12:00:00`))}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleSchedule(row.item)}
                    className="rounded-md border border-primary px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    {t('bucketList.scheduleTitle')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ViewSwitcher
          options={[
            { value: 'lista', label: t('viewMode.list') },
            { value: 'mapa', label: t('viewMode.map') },
          ]}
          value={viewMode}
          onChange={handleViewModeChange}
          label={t('viewMode.label')}
        />

        {/* Only on your own list, and only while something is unlinked: it is
            a one-off tidy-up, not a permanent part of the page. */}
        {!isSharedView && user ? (
          <LinkWishesToCatalog items={items} races={races} userId={user.uid} />
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
            {canWrite && !isSharedView ? (
              <Link
                to="/planeamento/descobrir"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {t('findRaces.cta')}
              </Link>
            ) : null}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">{t('bucketList.noFilterMatch')}</p>
            <p className="mt-2 text-muted">{t('bucketList.noFilterHint')}</p>
          </div>
        ) : viewMode === 'mapa' ? (
          <div className="flex w-full flex-col gap-4">
            <Suspense fallback={<BucketListSkeleton />}>
              <BucketListMap items={pins.mapped} className="w-full" />
            </Suspense>
            <Suspense fallback={null}>
              <UnmappedBucketListPanel items={pins.unmapped} />
            </Suspense>
          </div>
        ) : (
          <WishList
            items={sortedItems}
            races={isSharedView ? [] : races}
            season={isSharedView ? new Map() : season}
            anchorRaceIds={isSharedView ? new Set() : anchorIds}
            actions={(item) => (
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
                          ? `/planeamento/${item.id}/editar?owner=${activeOwnerId}`
                          : `/planeamento/${item.id}/editar`
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
                    onClick={() => void handleSchedule(item)}
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

      <ScheduleRaceDialog
        open={itemToSchedule !== null}
        race={itemToSchedule ? { name: wishSubject(itemToSchedule, races).name } : null}
        disciplines={scheduleDisciplines}
        offer={offer}
        loading={loadingOffer}
        saving={scheduling}
        onCancel={() => setItemToSchedule(null)}
        onConfirm={handleConfirmSchedule}
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
