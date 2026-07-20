import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmojiPicker } from '../../components/EmojiPicker'
import { PageShell } from '../../components/PageShell/PageShell'
import { usePerformanceGoals } from '../../hooks/usePerformanceGoals'
import { DuplicatePerformanceGoalError, getPerformanceGoal } from '../../services/performanceGoals'
import type { EventType, PerformanceGoalCreate, PerformanceGoalType } from '../../types'
import { EVENT_TYPES, PERFORMANCE_GOAL_TYPES } from '../../types'
import { formatEventTypeLabel } from '../../types/Goal'
import {
  formatPerformanceGoalTypeLabel,
  validatePerformanceGoalFields,
} from '../../types/PerformanceGoal'
import { joinPace, splitPace } from '../../utils/pace'
import { getInvalidTimeMessage, joinTime, splitTime } from '../../utils/time'

type FormState = {
  type: PerformanceGoalType
  eventType: EventType
  year: string
  paceMinutes: string
  paceSeconds: string
  timeHours: string
  timeMinutes: string
  timeSeconds: string
  emoji: string
  notes: string
}

function currentYear(): number {
  return new Date().getFullYear()
}

function emptyForm(): FormState {
  return {
    type: 'pr_target',
    eventType: 'km_10',
    year: String(currentYear()),
    paceMinutes: '',
    paceSeconds: '',
    timeHours: '',
    timeMinutes: '',
    timeSeconds: '',
    emoji: '🎯',
    notes: '',
  }
}

export function PerformanceGoalForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { addPerformanceGoal, editPerformanceGoal } = usePerformanceGoals()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loadingGoal, setLoadingGoal] = useState(isEditing)
  const [readOnly, setReadOnly] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear() - 1 + index)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function loadGoal() {
      setLoadingGoal(true)
      try {
        const goal = await getPerformanceGoal(id!)
        if (cancelled) return
        if (!goal) {
          setError(t('errors.performanceGoalNotFound'))
          return
        }
        const paceParts = splitPace(goal.targetPace ?? '')
        const timeParts = splitTime(goal.targetTime ?? '')
        setForm({
          type: goal.type,
          eventType: goal.eventType,
          year: String(goal.year),
          paceMinutes: paceParts.minutes,
          paceSeconds: paceParts.seconds,
          timeHours: timeParts.hours,
          timeMinutes: timeParts.minutes,
          timeSeconds: timeParts.seconds,
          emoji: goal.emoji ?? '🎯',
          notes: goal.notes ?? '',
        })
        setReadOnly(goal.year < currentYear())
      } catch {
        if (!cancelled) setError(t('errors.performanceGoalLoadError'))
      } finally {
        if (!cancelled) setLoadingGoal(false)
      }
    }

    void loadGoal()
    return () => {
      cancelled = true
    }
  }, [id])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validateForm(): PerformanceGoalCreate | null {
    const year = Number(form.year)
    const targetPace =
      form.type === 'pace_target' ? joinPace(form.paceMinutes, form.paceSeconds) : undefined
    const targetTime =
      form.type === 'time_target'
        ? joinTime(form.timeHours, form.timeMinutes, form.timeSeconds)
        : undefined
    const payload: PerformanceGoalCreate = {
      type: form.type,
      eventType: form.eventType,
      year,
      emoji: form.emoji || undefined,
      notes: form.notes.trim() || undefined,
      targetPace,
      targetTime,
    }

    const errors = validatePerformanceGoalFields(payload)
    if (!form.year || Number.isNaN(year)) {
      errors.year = t('validation.invalidYear')
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return null
    return payload
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (readOnly) return
    setError(null)

    const payload = validateForm()
    if (!payload) return

    setSubmitting(true)
    try {
      if (isEditing && id) {
        await editPerformanceGoal(id, payload)
      } else {
        await addPerformanceGoal(payload)
      }
      navigate('/objetivos')
    } catch (submitError) {
      if (submitError instanceof DuplicatePerformanceGoalError) {
        setError(submitError.message)
      } else {
        setError(t('errors.performanceGoalSaveError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingGoal) {
    return (
      <PageShell title={t('goals.performanceTitle')}>
        <p className="mt-6 text-muted">{t('common.loading')}</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={t('goals.performanceTitle')}>
      {readOnly ? (
        <p className="mt-6 text-sm text-muted">{t('performanceGoalForm.readOnlyPast')}</p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-foreground">
              {t('performanceGoalForm.goalType')}
            </label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value as PerformanceGoalType)}
              disabled={readOnly}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
            >
              {PERFORMANCE_GOAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatPerformanceGoalTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-semibold text-foreground">
              {t('eventForm.eventType')}
            </label>
            <select
              id="eventType"
              value={form.eventType}
              onChange={(e) => updateField('eventType', e.target.value as EventType)}
              disabled={readOnly}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatEventTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.type === 'pace_target' ? (
          <fieldset disabled={readOnly}>
            <legend className="block text-sm font-semibold text-foreground">{t('performanceGoalForm.targetPaceLegend')}</legend>
            <div className="mt-2 grid max-w-xs grid-cols-2 gap-3">
              <div>
                <label htmlFor="paceMinutes" className="block text-xs text-muted">
                  {t('resultsForm.minutes')}
                </label>
                <input
                  id="paceMinutes"
                  type="number"
                  min="0"
                  value={form.paceMinutes}
                  onChange={(e) => updateField('paceMinutes', e.target.value)}
                  placeholder="5"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="paceSeconds" className="block text-xs text-muted">
                  {t('resultsForm.seconds')}
                </label>
                <input
                  id="paceSeconds"
                  type="number"
                  min="0"
                  max="59"
                  value={form.paceSeconds}
                  onChange={(e) => updateField('paceSeconds', e.target.value)}
                  placeholder="00"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">{t('performanceGoalForm.paceAchievedHint')}</p>
            {fieldErrors.targetPace ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.targetPace}</p>
            ) : null}
          </fieldset>
        ) : null}

        {form.type === 'time_target' ? (
          <fieldset disabled={readOnly}>
            <legend className="block text-sm font-semibold text-foreground">{t('performanceGoalForm.targetTimeLegend')}</legend>
            <div className="mt-2 grid max-w-md grid-cols-3 gap-3">
              <div>
                <label htmlFor="timeHours" className="block text-xs text-muted">
                  {t('resultsForm.hours')}
                </label>
                <input
                  id="timeHours"
                  type="number"
                  min="0"
                  value={form.timeHours}
                  onChange={(e) => updateField('timeHours', e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="timeMinutes" className="block text-xs text-muted">
                  {t('resultsForm.minutes')}
                </label>
                <input
                  id="timeMinutes"
                  type="number"
                  min="0"
                  max="59"
                  value={form.timeMinutes}
                  onChange={(e) => updateField('timeMinutes', e.target.value)}
                  placeholder="45"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="timeSeconds" className="block text-xs text-muted">
                  {t('resultsForm.seconds')}
                </label>
                <input
                  id="timeSeconds"
                  type="number"
                  min="0"
                  max="59"
                  value={form.timeSeconds}
                  onChange={(e) => updateField('timeSeconds', e.target.value)}
                  placeholder="00"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">{getInvalidTimeMessage()}</p>
            {fieldErrors.targetTime ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.targetTime}</p>
            ) : null}
          </fieldset>
        ) : null}

        {form.type === 'pr_target' ? (
          <p className="text-sm text-muted">
            {t('performanceGoalForm.prTargetHint', { year: form.year || '…' })}
          </p>
        ) : null}

        <div>
          <label htmlFor="year" className="block text-sm font-semibold text-foreground">
              {t('common.year')}
          </label>
          <select
            id="year"
            value={form.year}
            onChange={(e) => updateField('year', e.target.value)}
            disabled={readOnly}
            className="mt-1 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {fieldErrors.year ? <p className="mt-1 text-sm text-danger">{fieldErrors.year}</p> : null}
        </div>

        <div>
          <label htmlFor="emoji" className="block text-sm font-semibold text-foreground">
            {t('common.emoji')}
          </label>
          <div className="mt-1">
            <EmojiPicker value={form.emoji} onChange={(emoji) => updateField('emoji', emoji)} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-foreground">
            {t('common.notes')}
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={t('performanceGoalForm.notesPlaceholder')}
            disabled={readOnly}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 disabled:opacity-60"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {fieldErrors.type ? <p className="text-sm text-danger">{fieldErrors.type}</p> : null}

        <div className="flex flex-wrap gap-3">
          {!readOnly ? (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? t('common.saving') : t('common.save')}
            </button>
          ) : null}
          <Link
            to="/objetivos"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </PageShell>
  )
}
