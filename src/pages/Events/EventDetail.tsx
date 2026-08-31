import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  PersonalRecordIndicator,
  personalRecordRowClass,
} from '../../components/PersonalRecordIndicator/PersonalRecordIndicator'
import { VerifiedResultIndicator } from '../../components/VerifiedResultIndicator/VerifiedResultIndicator'
import { StatusBadge } from '../../components/StatusBadge'
import { EventMediaGallery } from '../../components/EventMediaGallery/EventMediaGallery'
import { EventMediaUpload } from '../../components/EventMediaUpload/EventMediaUpload'
import { EventTrackSection } from '../../components/EventTrack'
import { CourseHistory } from '../../components/CourseHistory'
import { OfficialResultsLookup } from '../../components/OfficialResultsLookup/OfficialResultsLookup'
import { EventResultEditor } from '../../components/EventResultEditor'
import { PencilIcon } from '../../components/icons/actionIcons'
import { PageShell } from '../../components/PageShell/PageShell'
import { FinishFlagIcon, RoadIcon, StatStrip, StopwatchIcon } from '../../components/StatStrip'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEventMedia } from '../../hooks/useEventMedia'
import { useEventTrack } from '../../hooks/useEventTrack'
import { useEvents } from '../../hooks/useEvents'
import { useSharedEvents } from '../../hooks/useSharedEvents'
import { useShares } from '../../hooks/useShares'
import { deleteEventMedia, uploadEventMediaFiles } from '../../services/eventMedia'
import { getEvent } from '../../services/events'
import type { Event } from '../../types/Event'
import type { EventMedia } from '../../types/EventMedia'
import type { MediaValidationErrorCode } from '../../utils/mediaValidation'
import { formatEventTypeLabel } from '../../types/Goal'
import { formatClassificationDisplay } from '../../utils/classification'
import { formatDatePt, isFutureDate } from '../../utils/date'
import { getPersonalRecordIds } from '../../utils/bestPerformances'
import { buildCourseComparison } from '../../utils/analytics/course'
import { canRecoverEventToBucketList, eventToBucketListItem } from '../../utils/eventToBucketList'
import { eventHasCoordinates } from '../../services/eventGeocoding'
import {
  hasEventsAccess,
  hasSharedResultsAccess,
} from '../../../shared/shares/permissions'
import {
  eventLinkState,
  getEventDetailReturnTo,
  parseOwnerSearchParam,
  type EventDetailState,
} from '../../utils/eventNavigation'

const EventLocationMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.EventLocationMap })),
)

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-semibold text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function EventDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const toast = useToast()
  const [editingResult, setEditingResult] = useState(
    () => searchParams.get('resultado') === 'editar',
  )
  const { shares } = useShares()
  const { allEvents, removeEvent } = useEvents()
  const { addItem } = useBucketList()

  const requestedOwnerId = parseOwnerSearchParam(searchParams)
  const activeShare = useMemo(
    () =>
      shares.received.find(
        (share) =>
          share.status === 'active' &&
          share.ownerId === requestedOwnerId &&
          (hasEventsAccess(share.permissions.events) ||
            hasSharedResultsAccess(share.permissions.events)),
      ),
    [requestedOwnerId, shares.received],
  )
  const sharedOwnerId = activeShare?.ownerId ?? null
  const isSharedView = sharedOwnerId !== null
  const sharedEvents = useSharedEvents(sharedOwnerId)
  const hideResults = sharedEvents.permissions?.events === 'read_no_results'
  const ownerLabel = useMemo(() => {
    if (!sharedOwnerId) return ''
    const share = shares.received.find(
      (entry) => entry.ownerId === sharedOwnerId && entry.status === 'active',
    )
    return share?.ownerDisplayName?.trim() || sharedEvents.ownerDisplayName || ''
  }, [sharedOwnerId, shares.received, sharedEvents.ownerDisplayName])

  const {
    items: mediaItems,
    loading: mediaLoading,
    error: mediaError,
    count: mediaCount,
    mergeUploaded,
  } = useEventMedia(isSharedView ? undefined : id)

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recovering, setRecovering] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<
    Array<{ fileName: string; code: MediaValidationErrorCode }>
  >([])
  const [itemToDelete, setItemToDelete] = useState<EventMedia | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // A shared view reads through a callable, not Firestore, so subscribing there
  // would only produce permission errors.
  const { track, loading: trackLoading } = useEventTrack(isSharedView ? undefined : event?.id)

  // Built from events already in memory, so a repeated course costs no reads and
  // needs no activity file: the official time is what ranks the runnings.
  const courseComparison = useMemo(
    () => (event && !isSharedView ? buildCourseComparison(event, allEvents) : null),
    [event, isSharedView, allEvents],
  )

  const personalRecordIds = isSharedView
    ? new Set<string>()
    : getPersonalRecordIds(allEvents)
  const isRecord = event ? personalRecordIds.has(event.id) : false
  const returnTo = getEventDetailReturnTo(location.state, searchParams)
  const detailLinkState = eventLinkState(returnTo).state

  useEffect(() => {
    if (!id) return

    let cancelled = false

    if (sharedOwnerId) {
      if (sharedEvents.loading) {
        setLoading(true)
        return
      }

      if (sharedEvents.error) {
        setError(sharedEvents.error)
        setEvent(null)
        setLoading(false)
        return
      }

      const found = sharedEvents.events.find((item) => item.id === id)
      if (!cancelled) {
        setEvent(found ?? null)
        setError(found ? null : t('eventDetail.notFound'))
        setLoading(false)
      }
      return () => {
        cancelled = true
      }
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const loaded = await getEvent(id!)
        if (cancelled) return
        if (!loaded) {
          setError(t('eventDetail.notFound'))
          setEvent(null)
          return
        }
        setEvent(loaded)
      } catch {
        if (!cancelled) setError(t('eventDetail.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id, sharedOwnerId, sharedEvents.loading, sharedEvents.error, sharedEvents.events, t])

  useEffect(() => {
    if (isSharedView) return

    const state = location.state as EventDetailState | null
    if (!state?.uploadedMedia?.length) return

    mergeUploaded(state.uploadedMedia)
    const nextState = state.returnTo ? { returnTo: state.returnTo } : null
    navigate(location.pathname, { replace: true, state: nextState })
  }, [isSharedView, location.pathname, location.state, mergeUploaded, navigate])

  async function handleRecoverToBucketList() {
    if (!event) return

    setRecovering(true)
    try {
      await addItem(eventToBucketListItem(event))
      await removeEvent(event.id)
      navigate('/bucket-list')
    } catch {
      setError(t('eventDetail.recoverError'))
    } finally {
      setRecovering(false)
    }
  }

  async function handleUploadMedia() {
    if (!event || !user || selectedFiles.length === 0) return
    if (!navigator.onLine) {
      toast.error(t('eventMedia.offline'))
      return
    }

    setUploading(true)
    setUploadErrors([])
    try {
      const result = await uploadEventMediaFiles(event.id, user.uid, selectedFiles, mediaCount)
      setUploadErrors(result.failures)
      if (result.uploaded.length > 0) {
        mergeUploaded(result.uploaded)
        setSelectedFiles([])
        toast.success(t('eventMedia.uploaded'))
      } else if (result.failures.length > 0 && selectedFiles.length > 0) {
        toast.error(t('eventMedia.uploadFailed'))
      }
    } catch {
      toast.error(t('errors.unknown'))
    } finally {
      setUploading(false)
    }
  }

  async function handleConfirmDeleteMedia() {
    if (!event || !itemToDelete) return

    setDeletingId(itemToDelete.id)
    try {
      await deleteEventMedia(event.id, itemToDelete)
      setItemToDelete(null)
    } catch {
      toast.error(t('errors.unknown'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <PageShell title={t('eventDetail.title')}>
        {isSharedView ? (
          <SharedDataLoading section="events" ownerName={ownerLabel} variant="compact" />
        ) : (
          <p className="mt-6 text-muted">{t('common.loading')}</p>
        )}
      </PageShell>
    )
  }

  if (error || !event) {
    return (
      <PageShell title={t('eventDetail.title')}>
        <p className="mt-6 text-danger">{error ?? t('eventDetail.notFound')}</p>
        <Link to={returnTo} className="mt-4 inline-block text-sm font-semibold text-primary">
          {t('eventDetail.back')}
        </Link>
      </PageShell>
    )
  }

  const showResults = !hideResults && (event.status === 'completed' || Boolean(event.time))
  const canEditResult =
    !isSharedView && (event.status === 'confirmed' || event.status === 'completed')
  const canLookupAgain = !isSharedView && !hideResults

  function reloadEvent() {
    void getEvent(event!.id).then((loaded) => {
      if (loaded) setEvent(loaded)
    })
  }

  return (
    <PageShell greeting={t('eventDetail.title')} title={event.name}>
      <div className="mt-6 max-w-3xl">
        <Link to={returnTo} className="text-sm font-semibold text-primary hover:text-primary-hover">
          {t('eventDetail.back')}
        </Link>

        {isSharedView ? (
          <div className="mt-4">
            <SharedContextBanner
              message={t('shares.sharedEventDetailBanner', {
                name: ownerLabel,
              })}
            />
          </div>
        ) : null}

        <header
          className={[
            'mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface p-5',
            personalRecordRowClass(isRecord),
            isRecord ? 'border-accent' : 'border-border',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            {event.emoji ? (
              <span className="text-4xl leading-none" aria-hidden>
                {event.emoji}
              </span>
            ) : null}
            <div>
              <p className="font-display text-2xl leading-none tracking-wide text-foreground">
                {formatDatePt(event.date)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatEventTypeLabel(event.eventType)} · {event.realDistance} Km ·{' '}
                {event.location || t('common.dash')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isRecord ? <PersonalRecordIndicator /> : null}
            <StatusBadge status={event.status} />
          </div>
        </header>

        {editingResult && canEditResult ? (
          <div className="mt-6">
            <EventResultEditor
              event={event}
              canLookup={canEditResult}
              onEventChanged={reloadEvent}
              onSaved={() => {
                setEditingResult(false)
                toast.success(t('resultsForm.saved'))
                reloadEvent()
              }}
              onCancel={() => setEditingResult(false)}
            />
          </div>
        ) : showResults && event.time ? (
          // O ícone de voltar a procurar vive sobre os números, e só aparece
          // ao passar o rato: já há resultado, é uma segunda tentativa.
          <div className="group relative mt-6">
            <StatStrip
              items={[
                {
                  icon: <StopwatchIcon />,
                  value: event.time ?? t('common.dash'),
                  label: t('common.time'),
                  note: event.resultsVerified ? <VerifiedResultIndicator /> : undefined,
                },
                {
                  icon: <RoadIcon />,
                  value: event.pace ?? t('common.dash'),
                  label: t('common.paceUnit'),
                },
                {
                  icon: <FinishFlagIcon />,
                  value: event.classification
                    ? formatClassificationDisplay(event.classification)
                    : t('common.dash'),
                  label: t('common.classification'),
                },
              ]}
            />
            <div className="absolute -end-3 -top-3 z-10 flex gap-1">
              {canEditResult ? (
                <button
                  type="button"
                  onClick={() => setEditingResult(true)}
                  aria-label={t('eventDetail.editResult')}
                  title={t('eventDetail.editResult')}
                  className="rounded-full border border-border bg-surface p-1.5 text-muted opacity-0 shadow-sm transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                >
                  <PencilIcon />
                </button>
              ) : null}
            </div>
            {canLookupAgain ? (
              <OfficialResultsLookup event={event} onApplied={reloadEvent} layout="icon" />
            ) : null}
          </div>
        ) : showResults ? (
          <div className="mt-6 rounded-xl border border-border bg-surface p-5">
            <p className="font-semibold text-foreground">{t('eventDetail.noResultYet')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingResult(true)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {t('events.registerResults')}
              </button>

            </div>
          </div>
        ) : null}

        {!isSharedView && event.notes ? (
          <dl className="mt-6 rounded-xl border border-border bg-surface px-5">
            <DetailRow label={t('common.notes')}>{event.notes}</DetailRow>
          </dl>
        ) : null}

        {eventHasCoordinates(event) ? (
          <section className="mt-6" aria-label={t('eventDetail.locationMap')}>
            <h2 className="mb-3 text-sm font-semibold text-muted">{t('eventDetail.locationMap')}</h2>
            <Suspense
              fallback={
                <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
                  {t('common.loading')}
                </p>
              }
            >
              <EventLocationMap event={event} route={track?.route} />
            </Suspense>
          </section>
        ) : null}

        {courseComparison ? <CourseHistory comparison={courseComparison} /> : null}

        {/* A race still ahead has no file to upload, and offering one invites a
            training run to be filed as the race itself. */}
        {canEditResult && user && !isFutureDate(event.date) ? (
          <EventTrackSection
            event={event}
            track={track}
            loading={trackLoading}
            userId={user.uid}
          />
        ) : null}

        {!isSharedView && event.status === 'completed' ? (
          <section className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">{t('eventMedia.title')}</h2>
            {mediaError && mediaItems.length === 0 ? (
              <p className="mt-2 text-sm text-danger" role="alert">
                {t('eventMedia.loadError')}
              </p>
            ) : null}
            <div className="mt-4">
              <EventMediaGallery
                items={mediaItems}
                eventName={event.name}
                loading={mediaLoading}
                deletingId={deletingId}
                itemToDelete={itemToDelete}
                onRequestDelete={setItemToDelete}
                onConfirmDelete={() => void handleConfirmDeleteMedia()}
                onCancelDelete={() => setItemToDelete(null)}
              />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <EventMediaUpload
                currentCount={mediaCount}
                selectedFiles={selectedFiles}
                onSelectedFilesChange={setSelectedFiles}
                uploading={uploading}
                uploadErrors={uploadErrors}
                onUpload={() => void handleUploadMedia()}
              />
            </div>
          </section>
        ) : null}

        {!isSharedView ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/eventos/${event.id}/editar`}
            state={detailLinkState}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t('common.edit')}
          </Link>

          {canRecoverEventToBucketList(event.status) ? (
            <button
              type="button"
              onClick={() => void handleRecoverToBucketList()}
              disabled={recovering}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60"
            >
              {recovering ? t('eventDetail.recovering') : t('eventDetail.recoverBucket')}
            </button>
          ) : null}
        </div>
        ) : null}
      </div>
    </PageShell>
  )
}
