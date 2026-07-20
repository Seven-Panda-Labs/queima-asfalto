import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmojiPicker } from '../../components/EmojiPicker'
import { PageShell } from '../../components/PageShell/PageShell'
import { useGoals } from '../../hooks/useGoals'
import { DuplicateGoalError, getGoal } from '../../services/goals'
import type { EventType, GoalCreate } from '../../types'
import { EVENT_TYPES } from '../../types'
import { formatEventTypeLabel } from '../../types/Goal'

const MAX_TARGET_COUNT = 99

type FormState = {
  eventType: EventType
  targetCount: string
  year: string
  emoji: string
  notes: string
}

function currentYear(): number {
  return new Date().getFullYear()
}

function emptyForm(): FormState {
  return {
    eventType: 'km_5',
    targetCount: '1',
    year: String(currentYear()),
    emoji: '🎯',
    notes: '',
  }
}

export function GoalForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { addGoal, editGoal } = useGoals()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loadingGoal, setLoadingGoal] = useState(isEditing)
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
        const goal = await getGoal(id!)
        if (cancelled) return
        if (!goal) {
          setError(t('errors.goalNotFound'))
          return
        }
        setForm({
          eventType: goal.eventType,
          targetCount: String(goal.targetCount),
          year: String(goal.year),
          emoji: goal.emoji ?? '🎯',
          notes: goal.notes ?? '',
        })
      } catch {
        if (!cancelled) setError(t('errors.goalLoadError'))
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

  function validateForm(): GoalCreate | null {
    const errors: Record<string, string> = {}

    const targetCount = Number(form.targetCount)
    if (
      !form.targetCount ||
      Number.isNaN(targetCount) ||
      !Number.isInteger(targetCount) ||
      targetCount < 1 ||
      targetCount > MAX_TARGET_COUNT
    ) {
      errors.targetCount = t('validation.targetCountRange', { max: MAX_TARGET_COUNT })
    }

    const year = Number(form.year)
    if (!form.year || Number.isNaN(year) || !Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.year = t('validation.invalidYear')
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return null

    return {
      eventType: form.eventType,
      targetCount,
      year,
      emoji: form.emoji || undefined,
      notes: form.notes.trim() || undefined,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = validateForm()
    if (!payload) return

    setSubmitting(true)
    try {
      if (isEditing && id) {
        await editGoal(id, payload)
      } else {
        await addGoal(payload)
      }
      navigate('/objetivos')
    } catch (submitError) {
      if (submitError instanceof DuplicateGoalError) {
        setError(submitError.message)
      } else {
        setError(t('errors.goalSaveError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingGoal) {
    return (
      <PageShell title={isEditing ? t('goals.title') : t('goals.title')}>
        <p className="mt-6 text-muted">{t('common.loading')}</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={isEditing ? t('goals.title') : t('goals.title')}>
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
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
            <p className="mt-1 text-xs text-muted">{t('goals.countHint')}</p>
          </div>

          <div>
            <label htmlFor="targetCount" className="block text-sm font-semibold text-foreground">
              {t('goalForm.targetCount')}
            </label>
            <input
              id="targetCount"
              type="number"
              min={1}
              max={MAX_TARGET_COUNT}
              value={form.targetCount}
              onChange={(e) => updateField('targetCount', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
            {fieldErrors.targetCount ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.targetCount}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-semibold text-foreground">
            {t('common.year')}
          </label>
          <select
            id="year"
            value={form.year}
            onChange={(e) => updateField('year', e.target.value)}
            className="mt-1 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2"
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
            placeholder={t('goalForm.notesPlaceholder')}
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
