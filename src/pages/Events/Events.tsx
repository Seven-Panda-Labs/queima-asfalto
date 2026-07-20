import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { EventCalendar } from '../../components/EventCalendar/EventCalendar'
import {
  PersonalRecordIndicator,
  personalRecordRowClass,
} from '../../components/PersonalRecordIndicator/PersonalRecordIndicator'
import { VerifiedResultIndicator } from '../../components/VerifiedResultIndicator/VerifiedResultIndicator'
import { StatusBadge } from '../../components/StatusBadge'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner, SharedOwnerTabs } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useAuth } from '../../contexts/AuthContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import { useSharedEvents } from '../../hooks/useSharedEvents'
import { useSharedOwnerTabs } from '../../hooks/useSharedOwnerTabs'
import type { Event } from '../../types/Event'
import type { EventStatus } from '../../types/Event'
import { EVENT_STATUSES } from '../../types/Event'
import { formatDatePt } from '../../utils/date'
import { getPersonalRecordIds } from '../../utils/bestPerformances'
import {
  getEventsViewMode,
  setEventsViewMode,
  type EventsViewMode,
} from '../../utils/eventsViewMode'
import { formatEventStatusLabel } from '../../i18n/formatters'
import { eventsWithCoordinates, eventsWithoutCoordinates } from '../../utils/eventMap'
import { canRecoverEventToBucketList, eventToBucketListItem } from '../../utils/eventToBucketList'
import {
  buildEventDetailPath,
  buildEventsListPath,
  buildEventsListSearchParams,
  eventLinkState,
  parseEventsListSearchParams,
  type EventsListFilters,
} from '../../utils/eventNavigation'

const EventMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.EventMap })),
)
const UnmappedEventsPanel = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.UnmappedEventsPanel })),
)

const STATUS_FILTER_OPTIONS: Array<EventStatus | 'all'> = ['all', ...EVENT_STATUSES]

function EventsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
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

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: EventsViewMode
  onChange: (mode: EventsViewMode) => void
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
          mode === 'lista'
            ? 'bg-primary text-white'
            : 'text-muted hover:text-foreground',
        ].join(' ')}
      >
        {t('viewMode.list')}
      </button>
      <button
        type="button"
        aria-pressed={mode === 'calendario'}
        onClick={() => onChange('calendario')}
        className={[
          'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5',
          mode === 'calendario'
            ? 'bg-primary text-white'
            : 'text-muted hover:text-foreground',
        ].join(' ')}
      >
        {t('viewMode.calendar')}
      </button>
      <button
        type="button"
        aria-pressed={mode === 'mapa'}
        onClick={() => onChange('mapa')}
        className={[
          'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5',
          mode === 'mapa'
            ? 'bg-primary text-white'
            : 'text-muted hover:text-foreground',
        ].join(' ')}
      >
        {t('viewMode.map')}
      </button>
    </div>
  )
}

export function Events() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useBucketList()
  const currentYear = new Date().getFullYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultView = getEventsViewMode(user?.uid)
  const filters = parseEventsListSearchParams(searchParams, currentYear, defaultView)
  const { status: statusFilter, year: yearFilter, view: viewMode } = filters
  const {
    tabs: ownerTabs,
    activeOwnerId,
    activeOwner,
    isSharedView,
    setActiveOwnerId,
  } = useSharedOwnerTabs('events', 'shares.eventsTabMine')
  const returnTo = buildEventsListPath(filters, currentYear, activeOwnerId)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [eventToRecover, setEventToRecover] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const ownEvents = useEvents({
    status: statusFilter,
    year: yearFilter,
  })
  const sharedEvents = useSharedEvents(activeOwnerId)
  const hideResults = activeOwner?.permissions.events === 'read_no_results'

  const sharedFilteredEvents = useMemo(() => {
    return sharedEvents.events.filter((event) => {
      if (statusFilter !== 'all' && event.status !== statusFilter) return false
      if (yearFilter !== 'all' && event.date.getFullYear() !== yearFilter) return false
      return true
    })
  }, [sharedEvents.events, statusFilter, yearFilter])

  const events = isSharedView ? sharedFilteredEvents : ownEvents.events
  const allEvents = isSharedView ? sharedEvents.events : ownEvents.allEvents
  const loading = isSharedView ? sharedEvents.loading : ownEvents.loading
  const error = isSharedView ? sharedEvents.error : ownEvents.error
  const removeEvent = ownEvents.removeEvent

  const availableYears = useMemo(() => {
    const years = new Set(allEvents.map((event) => event.date.getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [allEvents])

  const personalRecordIds = useMemo(
    () => (isSharedView ? new Set<string>() : getPersonalRecordIds(allEvents)),
    [allEvents, isSharedView],
  )
  const mappedEvents = useMemo(() => eventsWithCoordinates(events), [events])
  const unmappedEvents = useMemo(() => eventsWithoutCoordinates(events), [events])

  function updateFilters(patch: Partial<EventsListFilters>) {
    const next = { ...filters, ...patch }
    const params = buildEventsListSearchParams(next, currentYear)
    if (activeOwnerId) params.set('owner', activeOwnerId)
    setSearchParams(params, { replace: true })
  }

  function handleViewModeChange(mode: EventsViewMode) {
    setEventsViewMode(mode, user?.uid)
    updateFilters({ view: mode })
  }

  const calendarInitialMonth = useMemo(() => {
    if (typeof yearFilter === 'number') {
      return new Date(yearFilter, new Date().getMonth(), 1)
    }
    if (events.length > 0) {
      return new Date(events[0].date.getFullYear(), events[0].date.getMonth(), 1)
    }
    return new Date()
  }, [yearFilter, events])

  async function handleConfirmRecover() {
    if (!eventToRecover) return

    setRecovering(true)
    try {
      await addItem(eventToBucketListItem(eventToRecover))
      await removeEvent(eventToRecover.id)
      setSuccessMessage(t('events.recovered', { name: eventToRecover.name }))
      setEventToRecover(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setRecovering(false)
    }
  }

  async function handleConfirmDelete() {
    if (!eventToDelete) return

    setDeleting(true)
    try {
      await removeEvent(eventToDelete.id)
      setSuccessMessage(t('events.deleted', { name: eventToDelete.name }))
      setEventToDelete(null)
    } catch {
      setSuccessMessage(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageShell title={t('events.title')}>
      <div className="mt-6 flex flex-col gap-6">
        <SharedOwnerTabs
          tabs={ownerTabs}
          activeOwnerId={activeOwnerId}
          onChange={setActiveOwnerId}
          ariaLabelKey="shares.eventsTabsLabel"
        />

        {isSharedView && loading ? (
          <SharedDataLoading section="events" ownerName={activeOwner?.label ?? ''} />
        ) : (
          <>
        {isSharedView ? (
          <SharedContextBanner
            message={t('shares.sharedEventsBanner', {
              name: activeOwner?.label ?? '',
            })}
          />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">{t('events.subtitle')}</p>
          {!isSharedView ? (
            <Link
              to="/eventos/novo"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              ➕ {t('common.add')}
            </Link>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">{t('common.status')}</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTER_OPTIONS.map((status) => (
              <FilterButton
                key={status}
                active={statusFilter === status}
                onClick={() => updateFilters({ status })}
              >
                {status === 'all' ? t('common.all') : formatEventStatusLabel(status)}
              </FilterButton>
            ))}
          </div>
        </div>

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

        <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

        {!isSharedView && loading ? (
          <EventsSkeleton />
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-semibold text-foreground">
              {isSharedView ? t('voice.empty.shared.events.title') : t('voice.empty.own.events.title')}
            </p>
            {isSharedView ? (
              <p className="mt-2 text-muted">
                {t('voice.empty.shared.events.hint', { name: activeOwner?.label ?? '' })}
              </p>
            ) : (
              <p className="mt-2 text-muted">
                {t('voice.empty.own.events.hint')}{' '}
                <span className="font-semibold text-accent">{t('common.letsGo')}</span>
              </p>
            )}
          </div>
        ) : viewMode === 'calendario' ? (
          <EventCalendar
            events={events}
            initialMonth={calendarInitialMonth}
            returnTo={returnTo}
            readOnly={isSharedView}
            ownerId={activeOwnerId}
          />
        ) : viewMode === 'mapa' ? (
          <div className="flex w-full flex-col gap-4">
            <Suspense fallback={<EventsSkeleton />}>
              <EventMap
                events={mappedEvents}
                className="w-full"
                returnTo={returnTo}
                readOnly={isSharedView}
                ownerId={activeOwnerId}
              />
            </Suspense>
            <Suspense fallback={null}>
              <UnmappedEventsPanel
                events={unmappedEvents}
                readOnly={isSharedView}
                ownerId={activeOwnerId}
                returnTo={returnTo}
              />
            </Suspense>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
                  <th className="px-4 py-3 font-semibold">{t('eventDetail.title')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.distance')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.location')}</th>
                  {!hideResults ? (
                    <>
                      <th className="px-4 py-3 font-semibold">{t('common.time')}</th>
                      <th className="px-4 py-3 font-semibold">{t('common.pace')}</th>
                    </>
                  ) : null}
                  <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                  {!isSharedView ? (
                    <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
                  ) : (
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">{t('common.actions')}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
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
                    <td className="px-4 py-3">{event.location || t('common.dash')}</td>
                    {!hideResults ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            {event.time ?? t('common.dash')}
                            {event.resultsVerified ? <VerifiedResultIndicator /> : null}
                          </span>
                        </td>
                        <td
                          className={[
                            'px-4 py-3 whitespace-nowrap',
                            isRecord ? 'font-semibold text-accent' : '',
                          ].join(' ')}
                        >
                          {event.pace ? `${event.pace} min/Km` : t('common.dash')}
                        </td>
                      </>
                    ) : null}
                    <td className="px-4 py-3">
                      <StatusBadge status={event.status} />
                    </td>
                    {!isSharedView ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-nowrap gap-1">
                        <Link
                          to={`/eventos/${event.id}`}
                          state={eventLinkState(returnTo).state}
                          title={t('events.viewEvent')}
                          className="rounded-md px-2 py-1 text-base hover:bg-background"
                        >
                          👁️
                        </Link>
                        <Link
                          to={`/eventos/${event.id}/editar`}
                          state={eventLinkState(returnTo).state}
                          title={t('events.editEvent')}
                          className="rounded-md px-2 py-1 text-base hover:bg-background"
                        >
                          ✏️
                        </Link>
                        {event.status === 'confirmed' ? (
                          <Link
                            to={`/eventos/${event.id}/resultados`}
                            state={eventLinkState(returnTo).state}
                            title={t('events.registerResults')}
                            className="rounded-md px-2 py-1 text-base hover:bg-background"
                          >
                            ⏱️
                          </Link>
                        ) : null}
                        {event.status === 'completed' ? (
                          <Link
                            to={`/eventos/${event.id}/resultados`}
                            state={eventLinkState(returnTo).state}
                            title={t('events.viewResults')}
                            className="rounded-md px-2 py-1 text-base hover:bg-background"
                          >
                            📊
                          </Link>
                        ) : null}
                        {canRecoverEventToBucketList(event.status) ? (
                          <button
                            type="button"
                            onClick={() => setEventToRecover(event)}
                            title={t('events.recoverBucket')}
                            className="rounded-md px-2 py-1 text-base hover:bg-background"
                          >
                            🪣
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setEventToDelete(event)}
                          title={t('events.deleteEvent')}
                          className="rounded-md px-2 py-1 text-base hover:bg-background"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    ) : null}
                    {isSharedView ? (
                      <td className="px-4 py-3">
                        <Link
                          to={buildEventDetailPath(event.id, { ownerId: activeOwnerId, returnTo })}
                          state={eventLinkState(returnTo).state}
                          title={t('events.viewEvent')}
                          className="rounded-md px-2 py-1 text-base hover:bg-background"
                        >
                          👁️
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={eventToRecover !== null}
        title={t('events.recoverTitle')}
        message={
          eventToRecover
            ? t('events.recoverMessage', { name: eventToRecover.name })
            : ''
        }
        confirmLabel={t('common.recover')}
        onConfirm={() => void handleConfirmRecover()}
        onCancel={() => setEventToRecover(null)}
        loading={recovering}
      />

      <ConfirmDialog
        open={eventToDelete !== null}
        title={t('events.deleteTitle')}
        message={
          eventToDelete
            ? t('events.deleteMessage', { name: eventToDelete.name })
            : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setEventToDelete(null)}
        loading={deleting}
      />
    </PageShell>
  )
}
