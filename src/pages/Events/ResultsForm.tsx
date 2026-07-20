import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EventMediaUpload } from '../../components/EventMediaUpload/EventMediaUpload'
import { OfficialResultsLookup } from '../../components/OfficialResultsLookup/OfficialResultsLookup'
import { PageShell } from '../../components/PageShell/PageShell'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { uploadEventMediaFiles } from '../../services/eventMedia'
import { getEvent, saveResults } from '../../services/events'
import type { Event } from '../../types/Event'
import type { MediaValidationErrorCode } from '../../utils/mediaValidation'
import {
  formatClassification,
  getInvalidClassificationMessage,
  parseClassification,
} from '../../utils/classification'
import { calculatePace } from '../../utils/pace'
import {
  getInvalidTimeMessage,
  joinTime,
  normalizeTime,
  splitTime,
  validateTime,
} from '../../utils/time'
import { eventLinkState, getReturnTo } from '../../utils/eventNavigation'

export function ResultsForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = getReturnTo(location.state)
  const detailLinkState = eventLinkState(returnTo).state
  const toast = useToast()
  const { user } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [position, setPosition] = useState('')
  const [totalParticipants, setTotalParticipants] = useState('')
  const [notes, setNotes] = useState('')
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([])
  const [mediaUploadErrors, setMediaUploadErrors] = useState<
    Array<{ fileName: string; code: MediaValidationErrorCode }>
  >([])
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function loadEvent() {
      setLoadingEvent(true)
      try {
        const loaded = await getEvent(id!)
        if (cancelled) return
        if (!loaded) {
          setLoadError(t('eventDetail.notFound'))
          return
        }
        if (loaded.status !== 'confirmed' && loaded.status !== 'completed') {
          setLoadError(t('resultsForm.notAllowed'))
          return
        }
        setEvent(loaded)
        const timeParts = splitTime(loaded.time ?? '')
        setHours(timeParts.hours)
        setMinutes(timeParts.minutes)
        setSeconds(timeParts.seconds)

        const classification = parseClassification(loaded.classification ?? '')
        if (classification) {
          setPosition(String(classification.position))
          setTotalParticipants(String(classification.total))
        } else {
          setPosition('')
          setTotalParticipants('')
        }

        setNotes(loaded.notes ?? '')
      } catch {
        if (!cancelled) setLoadError(t('resultsForm.loadError'))
      } finally {
        if (!cancelled) setLoadingEvent(false)
      }
    }

    void loadEvent()
    return () => {
      cancelled = true
    }
  }, [id])

  const timeValue = joinTime(hours, minutes, seconds)

  const pacePreview = useMemo(() => {
    if (!event || !validateTime(timeValue)) return null
    const normalized = normalizeTime(timeValue)
    return normalized ? calculatePace(normalized, event.realDistance) : null
  }, [event, timeValue])

  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    if (!id || !event) return

    const errors: Record<string, string> = {}

    if (!validateTime(timeValue)) {
      errors.time = getInvalidTimeMessage()
    }

    const hasClassification = position.trim() !== '' || totalParticipants.trim() !== ''
    if (hasClassification) {
      const pos = Number(position)
      const total = Number(totalParticipants)
      if (
        !Number.isInteger(pos) ||
        !Number.isInteger(total) ||
        pos <= 0 ||
        total <= 0 ||
        pos > total
      ) {
        errors.classification = getInvalidClassificationMessage()
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const classification =
      position.trim() && totalParticipants.trim()
        ? formatClassification(Number(position), Number(totalParticipants))
        : undefined

    setSubmitting(true)
    setSubmitError(null)

    try {
      await saveResults(id, {
        time: timeValue,
        classification,
        notes: notes.trim() || undefined,
      })
      toast.success(t('resultsForm.saved'))

      let uploadedMedia: Awaited<ReturnType<typeof uploadEventMediaFiles>>['uploaded'] = []
      if (pendingMediaFiles.length > 0 && user) {
        if (!navigator.onLine) {
          toast.error(t('eventMedia.offline'))
        } else {
          const result = await uploadEventMediaFiles(id, user.uid, pendingMediaFiles, 0)
          uploadedMedia = result.uploaded
          setMediaUploadErrors(result.failures)
          if (result.uploaded.length > 0) {
            toast.success(t('eventMedia.uploaded'))
          }
        }
      }

      navigate(`/eventos/${id}`, {
        state: {
          returnTo,
          ...(uploadedMedia.length > 0 ? { uploadedMedia } : {}),
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.unknown')
      setSubmitError(t('errors.resultsSaveFailed', { message }))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingEvent) {
    return (
      <PageShell title={t('resultsForm.title')}>
        <p className="mt-6 text-muted">{t('common.loading')}</p>
      </PageShell>
    )
  }

  if (loadError || !event) {
    return (
      <PageShell title={t('resultsForm.title')}>
        <p className="mt-6 text-danger">{loadError ?? t('eventDetail.notFound')}</p>
        <Link
          to={id ? `/eventos/${id}` : returnTo}
          state={detailLinkState}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t('common.back')}
        </Link>
      </PageShell>
    )
  }

  return (
    <PageShell title={`${t('resultsForm.title')}: ${event.name}`}>
      <OfficialResultsLookup
        event={event}
        onApplied={() => {
          void getEvent(id!).then((loaded) => {
            if (!loaded) return
            setEvent(loaded)
            const timeParts = splitTime(loaded.time ?? '')
            setHours(timeParts.hours)
            setMinutes(timeParts.minutes)
            setSeconds(timeParts.seconds)
            const classification = parseClassification(loaded.classification ?? '')
            if (classification) {
              setPosition(String(classification.position))
              setTotalParticipants(String(classification.total))
            }
          })
        }}
      />

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        <fieldset>
          <legend className="block text-sm font-semibold text-foreground">{t('common.time')}</legend>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="hours" className="block text-xs text-muted">
                {t('resultsForm.hours')}
              </label>
              <input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value)
                  clearFieldError('time')
                }}
                placeholder="0"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="minutes" className="block text-xs text-muted">
                {t('resultsForm.minutes')}
              </label>
              <input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value)
                  clearFieldError('time')
                }}
                placeholder="25"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="seconds" className="block text-xs text-muted">
                {t('resultsForm.seconds')}
              </label>
              <input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => {
                  setSeconds(e.target.value)
                  clearFieldError('time')
                }}
                placeholder="30"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">{t('resultsForm.usedForPace')}</p>
          {pacePreview ? (
            <p className="mt-2 text-sm font-semibold text-success">
              {t('resultsForm.estimatedPace', { pace: pacePreview })}
            </p>
          ) : null}
          {fieldErrors.time ? <p className="mt-1 text-sm text-danger">{fieldErrors.time}</p> : null}
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-semibold text-foreground">{t('common.classification')}</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="position" className="block text-xs text-muted">
                {t('resultsForm.position')}
              </label>
              <input
                id="position"
                type="number"
                min="1"
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value)
                  clearFieldError('classification')
                }}
                placeholder="47"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="totalParticipants" className="block text-xs text-muted">
                {t('resultsForm.totalParticipants')}
              </label>
              <input
                id="totalParticipants"
                type="number"
                min="1"
                value={totalParticipants}
                onChange={(e) => {
                  setTotalParticipants(e.target.value)
                  clearFieldError('classification')
                }}
                placeholder="106"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">{t('resultsForm.classificationHint')}</p>
          {fieldErrors.classification ? (
            <p className="mt-1 text-sm text-danger">{fieldErrors.classification}</p>
          ) : null}
        </fieldset>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-foreground">
            {t('common.notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('resultsForm.notesPlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </div>

        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('eventMedia.pendingSection')}</h2>
          <p className="mt-1 text-xs text-muted">{t('eventMedia.limitsHint')}</p>
          <div className="mt-3">
            <EventMediaUpload
              currentCount={0}
              selectedFiles={pendingMediaFiles}
              onSelectedFilesChange={setPendingMediaFiles}
              showUploadButton={false}
              disabled={submitting}
              uploadErrors={mediaUploadErrors}
            />
          </div>
        </section>

        {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? t('common.saving') : t('common.save')}
          </button>
          <Link
            to={id ? `/eventos/${id}` : returnTo}
            state={detailLinkState}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </PageShell>
  )
}
