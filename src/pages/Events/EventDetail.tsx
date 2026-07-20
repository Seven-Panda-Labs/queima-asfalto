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
import { OfficialResultsLookup } from '../../components/OfficialResultsLookup/OfficialResultsLookup'
import { PageShell } from '../../components/PageShell/PageShell'
import { SharedDataLoading } from '../../components/SharedDataLoading/SharedDataLoading'
import { SharedContextBanner } from '../../components/SharedOwnerTabs/SharedOwnerTabs'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEventMedia } from '../../hooks/useEventMedia'
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
import { formatDatePt } from '../../utils/date'
import { getPersonalRecordIds } from '../../utils/bestPerformances'
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

  return (
    <PageShell title={t('eventDetail.title')}>
      <div className="mt-6 max-w-2xl">
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
            'mt-4 rounded-lg border bg-surface p-5',
            personalRecordRowClass(isRecord),
            isRecord ? 'border-accent' : 'border-border',
          ].join(' ')}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {event.emoji ? (
                <span className="text-3xl" aria-hidden>
                  {event.emoji}
                </span>
              ) : null}
              <div>
                <h1 className="font-display text-2xl tracking-wide text-primary">
                  {event.name}
                </h1>
                <p className="mt-1 text-muted">{formatDatePt(event.date)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isRecord ? <PersonalRecordIndicator /> : null}
              <StatusBadge status={event.status} />
            </div>
          </div>
        </header>

        <dl className="mt-6 rounded-lg border border-border bg-surface px-5">
          <DetailRow label={t('common.location')}>{event.location || t('common.dash')}</DetailRow>
          <DetailRow label={t('common.distance')}>{event.realDistance} Km</DetailRow>
          <DetailRow label={t('common.type')}>{formatEventTypeLabel(event.eventType)}</DetailRow>
          {!hideResults && (event.status === 'completed' || event.time) ? (
            <>
              <DetailRow label={t('common.time')}>
                <span className="inline-flex items-center gap-1.5">
                  {event.time ?? t('common.dash')}
                  {event.resultsVerified ? <VerifiedResultIndicator /> : null}
                </span>
              </DetailRow>
              <DetailRow label={t('common.pace')}>
                {event.pace ? `${event.pace} ${t('eventDetail.paceUnit')}` : t('common.dash')}
              </DetailRow>
              <DetailRow label={t('common.classification')}>
                {event.classification
                  ? formatClassificationDisplay(event.classification)
                  : t('common.dash')}
              </DetailRow>
            </>
          ) : null}
          {!isSharedView && event.notes ? (
            <DetailRow label={t('common.notes')}>{event.notes}</DetailRow>
          ) : null}
        </dl>

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
              <EventLocationMap event={event} />
            </Suspense>
          </section>
        ) : null}

        {!isSharedView && (event.status === 'confirmed' || event.status === 'completed') ? (
          <section className="mt-6">
            <OfficialResultsLookup
              event={event}
              onApplied={() => {
                void getEvent(event.id).then((loaded) => {
                  if (loaded) setEvent(loaded)
                })
              }}
            />
          </section>
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
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            ✏️ {t('common.edit')}
          </Link>
          {event.status === 'confirmed' || event.status === 'completed' ? (
            <Link
              to={`/eventos/${event.id}/resultados`}
              state={detailLinkState}
              className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {event.status === 'completed'
                ? `📊 ${t('events.viewResults')}`
                : `⏱️ ${t('events.registerResults')}`}
            </Link>
          ) : null}
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
