import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ParkrunEventPicker } from '../../components/ParkrunEventPicker/ParkrunEventPicker'
import { DatePicker } from '../../components/DatePicker'
import { EmojiPicker } from '../../components/EmojiPicker'
import { LocationAutocomplete } from '../../components/LocationAutocomplete'
import { PageShell } from '../../components/PageShell/PageShell'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import type { EventFormFromBucketListState } from '../BucketList/BucketList'
import { geocodeAndUpdateEvent } from '../../services/eventGeocoding'
import { getEvent } from '../../services/events'
import type { EventCreate, EventStatus, EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import { suggestEventEmoji } from '../../utils/eventEmojiRules'
import { formatEventStatusLabel, formatEventTypeLabel } from '../../i18n/formatters'
import { allowedStatusesForDate, normalizeStatusForDate, validateEventDateStatus } from '../../utils/eventValidation'
import { detectPlatform } from '../../../shared/officialResults'
import {
  canLookupParkrun,
  isCompleteParkrunnerId,
  isParkrunEventName,
} from '../../types/UserResultsProfile'
import { useToast } from '../../contexts/ToastContext'
import { useUserResultsProfile } from '../../hooks/useUserResultsProfile'
import { ParkrunProfilePromptDialog } from '../../components/ParkrunProfilePromptDialog/ParkrunProfilePromptDialog'
import type { ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import { eventLinkState, getReturnTo } from '../../utils/eventNavigation'

type EventKind = 'regular' | 'parkrun'

type EventFormLocationState = {
  parkrunMode?: boolean
}

const LocationMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.LocationMap })),
)

function hasMapCoordinates(form: FormState): boolean {
  return (
    typeof form.locationLat === 'number' &&
    typeof form.locationLng === 'number' &&
    Number.isFinite(form.locationLat) &&
    Number.isFinite(form.locationLng)
  )
}

type FormState = {
  name: string
  date: Date
  status: EventStatus
  realDistance: string
  eventType: EventType
  location: string
  locationLat?: number
  locationLng?: number
  emoji: string
  notes: string
  resultsUrl: string
}

const EMPTY_FORM: FormState = {
  name: '',
  date: new Date(),
  status: 'planned',
  realDistance: '',
  eventType: 'km_5',
  location: '',
  emoji: suggestEventEmoji({ name: '', date: new Date() }),
  notes: '',
  resultsUrl: '',
}

export function EventForm() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const location = useLocation()
  const navigate = useNavigate()
  const { addEvent, editEvent } = useEvents()
  const { removeItem } = useBucketList()
  const { profile: resultsProfile, saveProfile } = useUserResultsProfile()
  const toast = useToast()
  const returnTo = getReturnTo(location.state)
  const detailPath = id ? `/eventos/${id}` : null
  const cancelPath = isEditing && detailPath ? detailPath : returnTo
  const cancelState = eventLinkState(returnTo).state

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [bucketListItemId, setBucketListItemId] = useState<string | null>(null)
  const [showRemoveFromBucketList, setShowRemoveFromBucketList] = useState(false)
  const [removingFromBucketList, setRemovingFromBucketList] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [statusAdjustment, setStatusAdjustment] = useState<{
    from: EventStatus
    to: EventStatus
  } | null>(null)
  const emojiManualRef = useRef(isEditing)
  const [showParkrunPrompt, setShowParkrunPrompt] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<EventCreate | null>(null)
  const [promptParkrunnerId, setPromptParkrunnerId] = useState('')
  const [parkrunPromptError, setParkrunPromptError] = useState<string | null>(null)
  const [savingParkrunProfile, setSavingParkrunProfile] = useState(false)
  const [eventKind, setEventKind] = useState<EventKind>('regular')
  const [parkrunSlug, setParkrunSlug] = useState<string | null>(null)
  const [parkrunCountryUrl, setParkrunCountryUrl] = useState<string | undefined>()

  const isParkrunEvent = eventKind === 'parkrun'

  useEffect(() => {
    if (id) return

    const state = location.state as (EventFormFromBucketListState & EventFormLocationState) | null
    if (!state?.parkrunMode) return

    setEventKind('parkrun')
    setForm((current) => ({
      ...current,
      realDistance: '5',
      eventType: 'km_5',
      emoji: '🌳',
    }))
  }, [id, location.state])

  useEffect(() => {
    if (id) return

    const state = location.state as EventFormFromBucketListState | null
    if (!state?.fromBucketList) return

    const { fromBucketList } = state
    setBucketListItemId(fromBucketList.bucketListItemId)
    setForm({
      name: fromBucketList.name,
      date: new Date(),
      status: 'planned',
      realDistance: String(fromBucketList.realDistance),
      eventType: fromBucketList.eventType,
      location: fromBucketList.location,
      locationLat: fromBucketList.locationLat,
      locationLng: fromBucketList.locationLng,
      emoji:
        fromBucketList.emoji ??
        suggestEventEmoji({
          name: fromBucketList.name,
          date: new Date(),
          location: fromBucketList.location,
        }),
      notes: fromBucketList.notes ?? '',
      resultsUrl: '',
    })
    emojiManualRef.current = Boolean(fromBucketList.emoji)
  }, [id, location.state])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function loadEvent() {
      setLoadingEvent(true)
      try {
        const event = await getEvent(id!)
        if (cancelled) return
        if (!event) {
          setError(t('eventDetail.notFound'))
          return
        }
        setForm({
          name: event.name,
          date: event.date,
          status: normalizeStatusForDate(event.status, event.date),
          realDistance: String(event.realDistance),
          eventType: EVENT_TYPES.includes(event.eventType) ? event.eventType : 'km_21_1',
          location: event.location,
          locationLat: event.locationLat,
          locationLng: event.locationLng,
          emoji: event.emoji ?? suggestEventEmoji({ name: event.name, date: event.date, location: event.location }),
          notes: event.notes ?? '',
          resultsUrl: event.resultsUrl ?? '',
        })
        setParkrunSlug(event.parkrunEventSlug ?? null)
        setParkrunCountryUrl(event.parkrunCountryUrl)
        if (event.parkrunEventSlug || event.resultsPlatform === 'parkrun' || isParkrunEventName(event.name)) {
          setEventKind('parkrun')
        }
        emojiManualRef.current = true
        const normalizedStatus = normalizeStatusForDate(event.status, event.date)
        if (normalizedStatus !== event.status) {
          setStatusAdjustment({ from: event.status, to: normalizedStatus })
        } else {
          setStatusAdjustment(null)
        }
      } catch {
        if (!cancelled) setError(t('eventDetail.loadError'))
      } finally {
        if (!cancelled) setLoadingEvent(false)
      }
    }

    void loadEvent()
    return () => {
      cancelled = true
    }
  }, [id])

  const selectedDate = form.date

  const statusOptions = useMemo(() => allowedStatusesForDate(selectedDate, true), [selectedDate])

  useEffect(() => {
    const normalizedStatus = normalizeStatusForDate(form.status, selectedDate)
    if (normalizedStatus === form.status) return

    setForm((current) => ({ ...current, status: normalizedStatus }))
    setStatusAdjustment({ from: form.status, to: normalizedStatus })
  }, [form.status, selectedDate])

  useEffect(() => {
    if (emojiManualRef.current) return

    const suggestedEmoji = suggestEventEmoji({
      name: form.name,
      date: form.date,
      location: form.location,
    })

    setForm((current) =>
      current.emoji === suggestedEmoji ? current : { ...current, emoji: suggestedEmoji },
    )
  }, [form.name, form.date, form.location])

  function handleLocationChange(location: string, coords?: { lat: number; lng: number }) {
    setForm((current) => ({
      ...current,
      location,
      locationLat: coords?.lat,
      locationLng: coords?.lng,
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.location
      return next
    })
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'status') {
      setStatusAdjustment(null)
    }
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function handleParkrunClearSelection() {
    setParkrunSlug(null)
    setParkrunCountryUrl(undefined)
  }

  function handleParkrunSelect(event: ParkrunCatalogEvent) {
    setParkrunSlug(event.slug)
    setParkrunCountryUrl(event.countryUrl)
    setForm((current) => ({
      ...current,
      name: event.longName,
      location: event.location,
      locationLat: event.lat,
      locationLng: event.lng,
      realDistance: '5',
      eventType: 'km_5',
      emoji: current.emoji || '🌳',
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.parkrunEvent
      delete next.name
      delete next.location
      return next
    })
  }

  function handleEventKindChange(kind: EventKind) {
    setEventKind(kind)
    if (kind === 'parkrun') {
      setForm((current) => ({
        ...current,
        realDistance: '5',
        eventType: 'km_5',
        resultsUrl: '',
      }))
      return
    }

    setParkrunSlug(null)
    setParkrunCountryUrl(undefined)
  }

  function validateForm(): EventCreate | null {
    const errors: Record<string, string> = {}

    if (!form.name.trim()) {
      errors.name = t('validation.nameRequired')
    }

    if (isParkrunEvent && !parkrunSlug) {
      errors.parkrunEvent = t('parkrun.eventRequired')
    }

    const distance = Number(form.realDistance)
    if (!form.realDistance || Number.isNaN(distance) || distance <= 0) {
      errors.realDistance = t('validation.distancePositive')
    }

    const dateStatus = validateEventDateStatus(selectedDate, form.status)
    if (!dateStatus.valid) {
      errors.status = dateStatus.message ?? t('eventForm.invalidStatusDate')
    }

    const trimmedResultsUrl = form.resultsUrl.trim()
    if (!isParkrunEvent && trimmedResultsUrl && !/^https?:\/\/.+/i.test(trimmedResultsUrl)) {
      errors.resultsUrl = t('validation.invalidLink')
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return null

    return {
      name: form.name.trim(),
      date: selectedDate,
      realDistance: distance,
      eventType: form.eventType,
      location: form.location.trim(),
      locationLat: form.locationLat,
      locationLng: form.locationLng,
      locationGeocodeQuery: form.locationLat != null ? form.location.trim() : undefined,
      status: form.status,
      emoji: form.emoji || undefined,
      notes: form.notes.trim() || undefined,
      resultsUrl: isParkrunEvent ? undefined : trimmedResultsUrl || undefined,
      resultsPlatform: isParkrunEvent
        ? 'parkrun'
        : detectPlatform(trimmedResultsUrl, form.name.trim()) ?? undefined,
      parkrunEventSlug: isParkrunEvent ? parkrunSlug ?? undefined : undefined,
      parkrunCountryUrl: isParkrunEvent ? parkrunCountryUrl : undefined,
    }
  }

  async function rememberParkrunFavorite(slug: string) {
    const favorites = resultsProfile.favoriteParkrunSlugs ?? []
    if (favorites.includes(slug)) return
    await saveProfile({ favoriteParkrunSlugs: [...favorites, slug] })
  }

  async function persistEvent(payload: EventCreate) {
    if (isEditing && id) {
      await editEvent(id, payload)
      if (payload.parkrunEventSlug) {
        await rememberParkrunFavorite(payload.parkrunEventSlug)
      }
      if (payload.locationLat == null) {
        await geocodeAndUpdateEvent(id, payload.location, i18n.language)
      }
      navigate(detailPath!, eventLinkState(returnTo))
      return
    }

    const newId = await addEvent(payload)
    if (payload.parkrunEventSlug) {
      await rememberParkrunFavorite(payload.parkrunEventSlug)
    }
    if (payload.locationLat == null) {
      await geocodeAndUpdateEvent(newId, payload.location, i18n.language)
    }
    if (bucketListItemId) {
      setShowRemoveFromBucketList(true)
    } else {
      navigate('/eventos')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = validateForm()
    if (!payload) return

    if (isParkrunEvent && !canLookupParkrun(resultsProfile)) {
      setPendingPayload(payload)
      setPromptParkrunnerId(resultsProfile.parkrunnerId ?? '')
      setParkrunPromptError(null)
      setShowParkrunPrompt(true)
      return
    }

    setSubmitting(true)
    try {
      await persistEvent(payload)
    } catch {
      setError(t('errors.eventSaveError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleParkrunSaveAndContinue() {
    if (!isCompleteParkrunnerId(promptParkrunnerId)) {
      setParkrunPromptError(t('officialResults.parkrunnerIdInvalid'))
      return
    }

    if (!pendingPayload) return

    setSavingParkrunProfile(true)
    setParkrunPromptError(null)
    try {
      await saveProfile({ parkrunnerId: promptParkrunnerId })
      setShowParkrunPrompt(false)
      setSubmitting(true)
      await persistEvent(pendingPayload)
      setPendingPayload(null)
    } catch {
      toast.error(t('officialResults.saveError'))
    } finally {
      setSavingParkrunProfile(false)
      setSubmitting(false)
    }
  }

  async function handleParkrunContinueWithout() {
    if (!pendingPayload) return

    setShowParkrunPrompt(false)
    setSubmitting(true)
    try {
      await persistEvent(pendingPayload)
      setPendingPayload(null)
    } catch {
      setError(t('errors.eventSaveError'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleParkrunPromptCancel() {
    setShowParkrunPrompt(false)
    setPendingPayload(null)
    setParkrunPromptError(null)
  }

  async function handleRemoveFromBucketList() {
    if (!bucketListItemId) {
      navigate('/eventos')
      return
    }

    setRemovingFromBucketList(true)
    try {
      await removeItem(bucketListItemId)
    } finally {
      setRemovingFromBucketList(false)
      navigate('/eventos')
    }
  }

  function handleKeepInBucketList() {
    navigate('/eventos')
  }

  if (loadingEvent) {
    return (
      <PageShell title={isEditing ? t('eventForm.edit') : t('eventForm.new')}>
        <p className="mt-6 text-muted">{t('common.loading')}</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={isEditing ? t('eventForm.edit') : t('eventForm.new')}>
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        {!isEditing ? (
          <div>
            <p className="text-sm font-semibold text-foreground">{t('eventForm.eventKindLabel')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleEventKindChange('regular')}
                className={[
                  'rounded-md border px-4 py-2 text-sm font-semibold',
                  eventKind === 'regular'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted hover:text-foreground',
                ].join(' ')}
              >
                {t('eventForm.kindRegular')}
              </button>
              <button
                type="button"
                onClick={() => handleEventKindChange('parkrun')}
                className={[
                  'rounded-md border px-4 py-2 text-sm font-semibold',
                  eventKind === 'parkrun'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted hover:text-foreground',
                ].join(' ')}
              >
                {t('eventForm.kindParkrun')}
              </button>
            </div>
          </div>
        ) : null}

        {isParkrunEvent ? (
          <div>
            <label htmlFor="parkrunEvent" className="block text-sm font-semibold text-foreground">
              {t('parkrun.eventLabel')}
            </label>
            <p className="mt-1 text-xs text-muted">{t('parkrun.eventHint')}</p>
            <div className="mt-1">
              <ParkrunEventPicker
                id="parkrunEvent"
                value={parkrunSlug}
                favoriteSlugs={resultsProfile.favoriteParkrunSlugs}
                onChange={handleParkrunSelect}
                onClearSelection={handleParkrunClearSelection}
                hasError={Boolean(fieldErrors.parkrunEvent)}
              />
            </div>
            {fieldErrors.parkrunEvent ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.parkrunEvent}</p>
            ) : null}
          </div>
        ) : (
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-foreground">
            {t('eventForm.name')}
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('eventForm.namePlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
          {fieldErrors.name ? <p className="mt-1 text-sm text-danger">{fieldErrors.name}</p> : null}
        </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-foreground">
              {t('common.date')}
            </label>
            <div className="mt-1">
              <DatePicker
                id="date"
                value={form.date}
                onChange={(date) => updateField('date', date)}
                hasError={Boolean(fieldErrors.date)}
              />
            </div>
            {fieldErrors.date ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.date}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-foreground">
              {t('eventForm.status')}
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => updateField('status', e.target.value as EventStatus)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatEventStatusLabel(status)}
                </option>
              ))}
            </select>
            {fieldErrors.status ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.status}</p>
            ) : null}
            {statusAdjustment ? (
              <p className="mt-1 text-sm text-muted">
                {t('eventForm.statusAdjusted', {
                  from: formatEventStatusLabel(statusAdjustment.from),
                  to: formatEventStatusLabel(statusAdjustment.to),
                })}
              </p>
            ) : null}
          </div>
        </div>

        {!isParkrunEvent ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="realDistance" className="block text-sm font-semibold text-foreground">
              {t('eventForm.distanceKm')}
            </label>
            <input
              id="realDistance"
              type="number"
              step="0.1"
              min="0.1"
              value={form.realDistance}
              onChange={(e) => updateField('realDistance', e.target.value)}
              placeholder={t('eventForm.distancePlaceholder')}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
            <p className="mt-1 text-xs text-muted">{t('eventForm.usedForPace')}</p>
            {fieldErrors.realDistance ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.realDistance}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-semibold text-foreground">
              {t('eventForm.eventType')}
            </label>
            <select
              id="eventType"
              value={form.eventType}
              onChange={(e) => updateField('eventType', e.target.value as EventType)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatEventTypeLabel(type)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{t('eventForm.usedForGoals')}</p>
          </div>
        </div>
        ) : null}

        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-foreground">
            {t('common.location')}
          </label>
          <LocationAutocomplete
            id="location"
            value={form.location}
            onChange={handleLocationChange}
            placeholder={t('eventForm.locationPlaceholder')}
            hasError={Boolean(fieldErrors.location)}
          />
          {hasMapCoordinates(form) ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted">{t('eventForm.locationMapPreview')}</p>
              <Suspense
                fallback={
                  <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                    {t('common.loading')}
                  </p>
                }
              >
                <LocationMap
                  key={`${form.locationLat}-${form.locationLng}`}
                  point={{
                    location: form.location,
                    locationLat: form.locationLat!,
                    locationLng: form.locationLng!,
                    status: form.status,
                  }}
                />
              </Suspense>
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="emoji" className="block text-sm font-semibold text-foreground">
            {t('common.emoji')}
          </label>
          <p className="mt-1 text-xs text-muted">{t('eventForm.emojiHint')}</p>
          <div className="mt-1">
            <EmojiPicker
              value={form.emoji}
              onChange={(emoji) => {
                emojiManualRef.current = true
                updateField('emoji', emoji)
              }}
            />
          </div>
        </div>

        {isParkrunEvent && !canLookupParkrun(resultsProfile) ? (
          <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
            {t('eventForm.parkrunSetupHint')}
          </p>
        ) : null}

        {!isParkrunEvent ? (
        <div>
          <label htmlFor="resultsUrl" className="block text-sm font-semibold text-foreground">
            {t('eventForm.resultsUrl')}
          </label>
          <input
            id="resultsUrl"
            type="url"
            value={form.resultsUrl}
            onChange={(e) => updateField('resultsUrl', e.target.value)}
            placeholder={t('eventForm.resultsUrlPlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted">{t('eventForm.resultsUrlHint')}</p>
          {fieldErrors.resultsUrl ? (
            <p className="mt-1 text-sm text-danger">{fieldErrors.resultsUrl}</p>
          ) : null}
        </div>
        ) : null}

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-foreground">
            {t('common.notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={t('eventForm.notesPlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? t('common.saving') : t('common.save')}
          </button>
          <Link
            to={cancelPath}
            state={cancelState}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={showRemoveFromBucketList}
        title={t('eventForm.removeBucketTitle')}
        message={t('eventForm.removeBucketMessage')}
        confirmLabel={t('common.delete')}
        onConfirm={() => void handleRemoveFromBucketList()}
        onCancel={handleKeepInBucketList}
        loading={removingFromBucketList}
      />

      <ParkrunProfilePromptDialog
        open={showParkrunPrompt}
        parkrunnerId={promptParkrunnerId}
        onParkrunnerIdChange={(value) => {
          setPromptParkrunnerId(value)
          setParkrunPromptError(null)
        }}
        onSaveAndContinue={() => void handleParkrunSaveAndContinue()}
        onContinueWithout={() => void handleParkrunContinueWithout()}
        onCancel={handleParkrunPromptCancel}
        saving={savingParkrunProfile || submitting}
        fieldError={parkrunPromptError}
      />
    </PageShell>
  )
}
