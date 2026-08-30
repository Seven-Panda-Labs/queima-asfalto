import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EventResultsUrlField } from '../EventResultsUrlField'
import { OfficialResultsLookup } from '../OfficialResultsLookup/OfficialResultsLookup'
import { TrackResultSuggestion } from '../TrackResultSuggestion'
import { useEventTrack } from '../../hooks/useEventTrack'
import type { Event } from '../../types/Event'
import { saveResults } from '../../services/events'
import {
  formatClassification,
  getInvalidClassificationMessage,
  parseClassification,
} from '../../utils/classification'
import { calculatePace } from '../../utils/pace'
import {
  getInvalidTimeMessage,
  hasTimeInput,
  joinTime,
  normalizeTime,
  splitTime,
  validateTime,
} from '../../utils/time'

type EventResultEditorProps = {
  event: Event
  onSaved: () => void
  onCancel: () => void
  /** Recarrega o evento sem fechar: colar o link destranca a procura aqui mesmo. */
  onEventChanged: () => void
  canLookup: boolean
}

const FIELD = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2'

/**
 * O resultado edita-se onde se lê. Antes vivia numa página à parte que também
 * carregava notas e fotografias, campos que já existem no evento e na sua
 * página de detalhe.
 */
export function EventResultEditor({
  event,
  onSaved,
  onCancel,
  onEventChanged,
  canLookup,
}: EventResultEditorProps) {
  const { t } = useTranslation()
  const { track } = useEventTrack(event.id)
  const initialTime = event.time ? splitTime(event.time) : null
  const initialPlaces = event.classification ? parseClassification(event.classification) : null

  const [hours, setHours] = useState(initialTime?.hours ?? '')
  const [minutes, setMinutes] = useState(initialTime?.minutes ?? '')
  const [seconds, setSeconds] = useState(initialTime?.seconds ?? '')
  const [position, setPosition] = useState(initialPlaces ? String(initialPlaces.position) : '')
  const [totalParticipants, setTotalParticipants] = useState(
    initialPlaces?.total ? String(initialPlaces.total) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const timeValue = joinTime(hours, minutes, seconds)

  const enteredTime = hasTimeInput(hours, minutes, seconds) ? timeValue : ''

  const pacePreview = useMemo(() => {
    if (!validateTime(timeValue)) return null
    const normalized = normalizeTime(timeValue)
    return normalized ? calculatePace(normalized, event.realDistance) : null
  }, [event.realDistance, timeValue])

  function applyTrackTime(time: string) {
    const parts = splitTime(time)
    setHours(parts.hours)
    setMinutes(parts.minutes)
    setSeconds(parts.seconds)
    clearFieldError('time')
  }

  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()

    const errors: Record<string, string> = {}
    if (!validateTime(timeValue)) errors.time = getInvalidTimeMessage()

    const hasPlaces = position.trim() !== '' || totalParticipants.trim() !== ''
    if (hasPlaces) {
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

    setSaving(true)
    setError(null)
    try {
      await saveResults(event.id, {
        time: timeValue,
        classification: hasPlaces
          ? formatClassification(Number(position), Number(totalParticipants))
          : undefined,
      })
      onSaved()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('errors.unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5">
      <fieldset className="border-0 p-0">
        <legend className="text-sm font-semibold text-foreground">{t('common.time')}</legend>
        <div className="mt-2 grid max-w-sm grid-cols-3 gap-3">
          {(
            [
              ['hours', t('resultsForm.hours'), hours, setHours, '0', 23],
              ['minutes', t('resultsForm.minutes'), minutes, setMinutes, '25', 59],
              ['seconds', t('resultsForm.seconds'), seconds, setSeconds, '30', 59],
            ] as const
          ).map(([key, label, value, setValue, placeholder, max]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-xs text-muted">
                {label}
              </label>
              <input
                id={key}
                type="number"
                min="0"
                max={max}
                value={value}
                onChange={(changeEvent) => {
                  setValue(changeEvent.target.value)
                  clearFieldError('time')
                }}
                placeholder={placeholder}
                className={FIELD}
              />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{t('resultsForm.usedForPace')}</p>
        {pacePreview ? (
          <p className="mt-2 text-sm font-semibold text-success">
            {t('resultsForm.estimatedPace', { pace: pacePreview })}
          </p>
        ) : null}
        {fieldErrors.time ? <p className="mt-1 text-sm text-danger">{fieldErrors.time}</p> : null}
      </fieldset>

      {track ? (
        <TrackResultSuggestion
          track={track}
          event={event}
          currentTime={enteredTime}
          onApplyTime={applyTrackTime}
        />
      ) : null}

      <fieldset className="mt-5 border-0 p-0">
        <legend className="text-sm font-semibold text-foreground">
          {t('common.classification')}
        </legend>
        <div className="mt-2 grid max-w-sm grid-cols-2 gap-3">
          <div>
            <label htmlFor="position" className="block text-xs text-muted">
              {t('resultsForm.position')}
            </label>
            <input
              id="position"
              type="number"
              min="1"
              value={position}
              onChange={(changeEvent) => {
                setPosition(changeEvent.target.value)
                clearFieldError('classification')
              }}
              className={FIELD}
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
              onChange={(changeEvent) => {
                setTotalParticipants(changeEvent.target.value)
                clearFieldError('classification')
              }}
              className={FIELD}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">{t('resultsForm.classificationHint')}</p>
        {fieldErrors.classification ? (
          <p className="mt-1 text-sm text-danger">{fieldErrors.classification}</p>
        ) : null}
      </fieldset>

      {canLookup ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t('officialResults.lookupTitle')}
          </p>
          <p className="mt-1 mb-3 text-xs text-muted">{t('officialResults.lookupHint')}</p>
          {event.resultsUrl || event.resultsPlatform ? (
            <OfficialResultsLookup event={event} onApplied={onSaved} layout="inline" />
          ) : (
            <EventResultsUrlField event={event} onSaved={onEventChanged} />
          )}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
