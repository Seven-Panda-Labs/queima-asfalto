import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EmojiPicker } from '../../components/EmojiPicker'
import { LocationAutocomplete } from '../../components/LocationAutocomplete'
import { PageShell } from '../../components/PageShell/PageShell'
import { useBucketList } from '../../hooks/useBucketList'
import { useSharedBucketList } from '../../hooks/useSharedBucketList'
import { getBucketListItem } from '../../services/bucketList'
import type { BucketListItemCreate } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { visibleDisciplines } from '../../domain/disciplinePreferences'
import { validateBucketListItem } from '../../utils/bucketListValidation'
import { deriveEventTypeFromName } from '../../utils/deriveEventTypeFromName'
import { formatTargetMonth, TARGET_MONTHS } from '../../utils/targetMonth'

const LocationMap = lazy(() =>
  import('../../components/EventMap').then((module) => ({ default: module.LocationMap })),
)

type FormState = {
  name: string
  location: string
  locationLat?: number
  locationLng?: number
  realDistance: string
  disciplines: EventType[]
  targetMonth: string
  targetYear: string
  isAnchor: boolean
  recurring: boolean
  link: string
  emoji: string
  notes: string
}

function hasMapCoordinates(form: FormState): boolean {
  return (
    typeof form.locationLat === 'number' &&
    typeof form.locationLng === 'number' &&
    Number.isFinite(form.locationLat) &&
    Number.isFinite(form.locationLng)
  )
}

function emptyForm(): FormState {
  const derived = deriveEventTypeFromName('')
  return {
    name: '',
    location: '',
    realDistance: String(derived.realDistance),
    disciplines: [derived.eventType],
    targetMonth: '',
    targetYear: '',
    isAnchor: false,
    recurring: false,
    link: '',
    emoji: '🏃',
    notes: '',
  }
}

export function BucketListForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const sharedOwnerId = searchParams.get('owner')
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const ownBucketList = useBucketList()
  const sharedBucketList = useSharedBucketList(sharedOwnerId)
  const isShared = Boolean(sharedOwnerId)
  const addItem = isShared ? sharedBucketList.addItem : ownBucketList.addItem
  const editItem = isShared ? sharedBucketList.editItem : ownBucketList.editItem
  const listPath = sharedOwnerId ? `/bucket-list?owner=${sharedOwnerId}` : '/bucket-list'

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loadingItem, setLoadingItem] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { enabledDisciplines, loading: loadingDisciplines } = useDisciplines()
  const disciplineDefaultRef = useRef(false)

  /** Whatever the item already picked stays offered, so editing cannot drop a
   *  discipline the user turned off after creating the item. */
  const disciplineOptions = useMemo(
    () => visibleDisciplines(enabledDisciplines, form.disciplines),
    [enabledDisciplines, form.disciplines],
  )

  /** `emptyForm` derives a discipline from an empty name, so a new item can
   *  open on one the user turned off. Corrected once, as soon as we know. */
  useEffect(() => {
    if (isEditing || loadingDisciplines || disciplineDefaultRef.current) return
    disciplineDefaultRef.current = true

    setForm((current) =>
      current.disciplines.some((discipline) => enabledDisciplines.includes(discipline))
        ? current
        : { ...current, disciplines: [enabledDisciplines[0]!] },
    )
  }, [isEditing, loadingDisciplines, enabledDisciplines])

  useEffect(() => {
    if (!id) return
    if (sharedOwnerId && sharedBucketList.loading) {
      setLoadingItem(true)
      return
    }

    let cancelled = false

    async function loadItem() {
      setLoadingItem(true)
      try {
        if (sharedOwnerId) {
          const item = sharedBucketList.items.find((entry) => entry.id === id)
          if (cancelled) return
          if (!item) {
            setError(t('errors.bucketItemNotFound'))
            return
          }
          setForm({
            name: item.name,
            location: item.location,
            locationLat: item.locationLat,
            locationLng: item.locationLng,
            realDistance: String(item.realDistance),
            disciplines: item.disciplines,
            targetMonth: item.targetMonth ?? '',
            targetYear: item.targetYear ? String(item.targetYear) : '',
            isAnchor: item.isAnchor === true,
            recurring: item.recurring === true,
            link: item.link ?? '',
            emoji: item.emoji ?? '🏃',
            notes: '',
          })
          return
        }

        const item = await getBucketListItem(id!)
        if (cancelled) return
        if (!item) {
          setError(t('errors.bucketItemNotFound'))
          return
        }
        setForm({
          name: item.name,
          location: item.location,
          locationLat: item.locationLat,
          locationLng: item.locationLng,
          realDistance: String(item.realDistance),
          disciplines: item.disciplines,
          targetMonth: item.targetMonth ?? '',
          targetYear: item.targetYear ? String(item.targetYear) : '',
          isAnchor: item.isAnchor === true,
          recurring: item.recurring === true,
          link: item.link ?? '',
          emoji: item.emoji ?? '🏃',
          notes: item.notes ?? '',
        })
      } catch {
        if (!cancelled) setError(t('errors.bucketItemLoadError'))
      } finally {
        if (!cancelled) setLoadingItem(false)
      }
    }

    void loadItem()
    return () => {
      cancelled = true
    }
  }, [id, sharedOwnerId, sharedBucketList.items, sharedBucketList.loading, t])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

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

  function handleNameChange(name: string) {
    const derived = deriveEventTypeFromName(name)
    setForm((current) => ({
      ...current,
      name,
      disciplines: [derived.eventType],
      realDistance: String(derived.realDistance),
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.name
      delete next.disciplines
      delete next.realDistance
      return next
    })
  }

  function toggleDiscipline(discipline: EventType) {
    setForm((current) => {
      const selected = current.disciplines.includes(discipline)
      if (selected) {
        const next = current.disciplines.filter((item) => item !== discipline)
        return { ...current, disciplines: next.length > 0 ? next : current.disciplines }
      }
      return { ...current, disciplines: [...current.disciplines, discipline] }
    })
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.disciplines
      return next
    })
  }

  function validateForm(): BucketListItemCreate | null {
    const payload: BucketListItemCreate = {
      name: form.name.trim(),
      location: form.location.trim(),
      locationLat: form.locationLat,
      locationLng: form.locationLng,
      locationGeocodeQuery: form.locationLat != null ? form.location.trim() : undefined,
      realDistance: Number(form.realDistance),
      disciplines: [...new Set(form.disciplines)],
      targetMonth: form.targetMonth.trim() || undefined,
      targetYear: form.targetYear ? Number(form.targetYear) : undefined,
      isAnchor: form.isAnchor,
      recurring: form.recurring,
      link: form.link.trim() || undefined,
      emoji: form.emoji || undefined,
      notes: form.notes.trim() || undefined,
    }

    const { valid, errors } = validateBucketListItem(payload)
    setFieldErrors(errors)
    if (!valid) return null

    return payload
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = validateForm()
    if (!payload) return

    setSubmitting(true)
    try {
      if (isEditing && id) {
        await editItem(id, payload)
      } else {
        await addItem(payload)
      }
      navigate(listPath)
    } catch {
      setError(t('bucketList.saveError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingItem) {
    return (
      <PageShell title={isEditing ? t('bucketList.editItem') : t('bucketList.newItem')}>
        <p className="mt-6 text-muted">{t('common.loading')}</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={isEditing ? t('bucketList.editItem') : t('bucketList.newItem')}>
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-foreground">
            {t('eventForm.name')}
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('eventForm.namePlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
          {fieldErrors.name ? <p className="mt-1 text-sm text-danger">{fieldErrors.name}</p> : null}
          <p className="mt-1 text-xs text-muted">{t('bucketList.nameHint')}</p>
        </div>

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
          {fieldErrors.location ? (
            <p className="mt-1 text-sm text-danger">{fieldErrors.location}</p>
          ) : null}
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
                  point={{
                    location: form.location,
                    locationLat: form.locationLat!,
                    locationLng: form.locationLng!,
                    status: 'planned',
                  }}
                />
              </Suspense>
            </div>
          ) : null}
        </div>

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
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
            {fieldErrors.realDistance ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.realDistance}</p>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">{t('bucketList.disciplines')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {disciplineOptions.map((type) => {
                const selected = form.disciplines.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDiscipline(type)}
                    className={[
                      'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                      selected
                        ? 'bg-primary text-white'
                        : 'bg-surface text-muted ring-1 ring-border hover:text-foreground',
                    ].join(' ')}
                  >
                    {formatEventTypeLabel(type)}
                  </button>
                )
              })}
            </div>
            {fieldErrors.disciplines ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.disciplines}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted">{t('bucketList.disciplinesHint')}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="targetMonth" className="block text-sm font-semibold text-foreground">
              {t('bucketList.targetMonth')}
            </label>
            <select
              id="targetMonth"
              value={form.targetMonth}
              onChange={(e) => updateField('targetMonth', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            >
              <option value="">{t('common.dash')}</option>
              {TARGET_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {formatTargetMonth(month)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{t('bucketList.targetMonthHint')}</p>
          </div>

          <div>
            <label htmlFor="targetYear" className="block text-sm font-semibold text-foreground">
              {t('bucketList.targetYear')}
            </label>
            <input
              id="targetYear"
              type="number"
              value={form.targetYear}
              onChange={(e) => updateField('targetYear', e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
            <p className="mt-1 text-xs text-muted">{t('bucketList.targetYearHint')}</p>
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isAnchor}
              onChange={(e) => updateField('isAnchor', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              {t('bucketList.isAnchor')}
              <span className="block text-xs text-muted">{t('bucketList.isAnchorHint')}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => updateField('recurring', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              {t('bucketList.recurring')}
              <span className="block text-xs text-muted">{t('bucketList.recurringHint')}</span>
            </span>
          </label>

          <div>
            <label htmlFor="link" className="block text-sm font-semibold text-foreground">
              {t('common.link')}
            </label>
            <input
              id="link"
              type="url"
              value={form.link}
              onChange={(e) => updateField('link', e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
            {fieldErrors.link ? <p className="mt-1 text-sm text-danger">{fieldErrors.link}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="emoji" className="block text-sm font-semibold text-foreground">
            {t('common.emoji')}
          </label>
          <div className="mt-1">
            <EmojiPicker
              id="emoji"
              value={form.emoji}
              onChange={(emoji) => updateField('emoji', emoji)}
            />
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
            placeholder={t('bucketList.notesPlaceholder')}
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
            to={listPath}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </PageShell>
  )
}
