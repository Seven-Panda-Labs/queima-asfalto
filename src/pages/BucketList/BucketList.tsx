import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { ScheduleDisciplineDialog } from '../../components/ScheduleDisciplineDialog/ScheduleDisciplineDialog'
import { useAuth } from '../../contexts/AuthContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useSharedBucketList } from '../../hooks/useSharedBucketList'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import type { BucketListItem } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import { formatEventTypeLabel } from '../../i18n/formatters'
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

function BucketListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  )
}

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: BucketListViewMode
  onChange: (mode: BucketListViewMode) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className="inline-flex w-full rounded-lg border border-border bg-background p-1 sm:w-auto"
      role="group"
      aria-label={t('viewMode.label')}
    >
      <button
        type="button"
        aria-pressed={mode === 'lista'}
        onClick={() => onChange('lista')}
        className={[
          'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5',
          mode === 'lista' ? 'bg-primary text-white' : 'text-muted hover:text-foreground',
        ].join(' ')}
      >
        {t('viewMode.list')}
      </button>
      <button
        type="button"
        aria-pressed={mode === 'mapa'}
        onClick={() => onChange('mapa')}
        className={[
          'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5',
          mode === 'mapa' ? 'bg-primary text-white' : 'text-muted hover:text-foreground',
        ].join(' ')}
      >
        {t('viewMode.map')}
      </button>
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
  const sharedBucketList = useSharedBucketList(activeOwnerId)

  const items = isSharedView ? sharedBucketList.items : ownBucketList.items
  const loading = isSharedView ? sharedBucketList.loading : ownBucketList.loading
  const error = isSharedView ? sharedBucketList.error : ownBucketList.error
  const removeItem = isSharedView ? sharedBucketList.removeItem : ownBucketList.removeItem
  const canWrite = !isSharedView || activeOwner?.permissions.bucketList === 'write'

  const addItemPath = activeOwnerId
    ? `/bucket-list/novo?owner=${activeOwnerId}`
    : '/bucket-list/novo'

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
          <p className="text-muted">{t('bucketList.subtitle')}</p>
          {canWrite ? (
            <Link
              to={addItemPath}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              ➕ {t('common.add')}
            </Link>
          ) : null}
        </div>

        {items.length > 0 ? (
          <>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{t('bucketList.discipline')}</p>
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  active={eventTypeFilter === 'all'}
                  onClick={() => setEventTypeFilter('all')}
                >
                  {t('bucketList.allDisciplines')}
                </FilterButton>
                {EVENT_TYPES.map((type) => (
                  <FilterButton
                    key={type}
                    active={eventTypeFilter === type}
                    onClick={() => setEventTypeFilter(type)}
                  >
                    {formatEventTypeLabel(type)}
                  </FilterButton>
                ))}
              </div>
            </div>

            {availableMonths.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{t('bucketList.targetMonthFilter')}</p>
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={monthFilter === 'all'}
                    onClick={() => setMonthFilter('all')}
                  >
                    {t('common.all')}
                  </FilterButton>
                  {availableMonths.map((month) => (
                    <FilterButton
                      key={month}
                      active={monthFilter === month}
                      onClick={() => setMonthFilter(month)}
                    >
                      {formatTargetMonth(month)}
                    </FilterButton>
                  ))}
                </div>
              </div>
            ) : null}

            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
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
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('eventDetail.title')}</th>
                  <th className="px-4 py-3 font-semibold">{t('bucketList.disciplines')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.location')}</th>
                  <th className="px-4 py-3 font-semibold">{t('bucketList.targetMonth')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.link')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
                        <span>{item.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {item.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')}
                    </td>
                    <td className="px-4 py-3">{item.location || t('common.dash')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTargetMonth(item.targetMonth)}
                    </td>
                    <td className="px-4 py-3">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:text-primary-hover"
                        >
                          {t('common.open')}
                        </a>
                      ) : (
                        t('common.dash')
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canWrite ? (
                          <>
                            <Link
                              to={
                                activeOwnerId
                                  ? `/bucket-list/${item.id}/editar?owner=${activeOwnerId}`
                                  : `/bucket-list/${item.id}/editar`
                              }
                              className="rounded-md px-2 py-1 text-sm font-semibold text-muted hover:bg-background hover:text-foreground"
                            >
                              {t('common.edit')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="rounded-md px-2 py-1 text-sm font-semibold text-muted hover:bg-background hover:text-foreground"
                            >
                              {t('common.delete')}
                            </button>
                          </>
                        ) : null}
                        {!isSharedView ? (
                          <button
                            type="button"
                            onClick={() => handleSchedule(item)}
                            className="rounded-md px-2 py-1 text-sm font-semibold text-primary hover:bg-background"
                          >
                            {t('common.schedule')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
