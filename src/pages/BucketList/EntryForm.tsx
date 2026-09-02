import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useRaceEntries } from '../../hooks/useRaceEntries'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { findOrCreateRaceId } from '../../services/races'
import type { EventType } from '../../types/Event'
import {
  ENTRY_METHODS,
  ENTRY_STATUSES,
  type EntryMethod,
  type EntryStatus,
  type RaceEntry,
} from '../../types/RaceEntry'

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground'

/** `YYYY-MM-DD` for a native date input, which is what an empty date needs. */
function toInputDate(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : ''
}

function fromInputDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

type FormState = {
  year: string
  discipline: EventType | ''
  entryMethod: EntryMethod
  entryStatus: EntryStatus
  raceDate: string
  raceDateConfirmed: boolean
  registrationOpensAt: string
  registrationClosesAt: string
  lotteryDrawAt: string
  placeConfirmByAt: string
  registrationUrl: string
  fee: string
  feeCurrency: string
  notes: string
}

function toFormState(entry: RaceEntry | null): FormState {
  return {
    year: String(entry?.year ?? new Date().getFullYear() + 1),
    discipline: entry?.discipline ?? '',
    entryMethod: entry?.entryMethod ?? 'unknown',
    entryStatus: entry?.entryStatus ?? 'watching',
    raceDate: toInputDate(entry?.raceDate),
    raceDateConfirmed: entry?.raceDateConfirmed ?? false,
    registrationOpensAt: toInputDate(entry?.registrationOpensAt),
    registrationClosesAt: toInputDate(entry?.registrationClosesAt),
    lotteryDrawAt: toInputDate(entry?.lotteryDrawAt),
    placeConfirmByAt: toInputDate(entry?.placeConfirmByAt),
    registrationUrl: entry?.registrationUrl ?? '',
    fee: entry?.fee !== undefined ? String(entry.fee) : '',
    feeCurrency: entry?.feeCurrency ?? '',
    notes: entry?.notes ?? '',
  }
}

/**
 * The planning story of one attempt at one race.
 *
 * Native date inputs rather than the app's `DatePicker`: every date here is
 * optional, and a picker that requires a value cannot say "not published yet",
 * which is the state most of these fields are in most of the time.
 */
export function EntryForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { items, loading: itemsLoading } = useBucketList()
  const { entries, loading: entriesLoading, addEntry, editEntry } = useRaceEntries()

  const item = useMemo(() => items.find((entry) => entry.id === id) ?? null, [items, id])
  const [year, setYear] = useState<number | null>(null)

  const existing = useMemo(() => {
    if (!id) return null
    const forItem = entries.filter((entry) => entry.bucketListItemId === id)
    if (year !== null) return forItem.find((entry) => entry.year === year) ?? null
    // The latest attempt is the one being planned, which is what the funnel shows.
    return forItem.reduce<RaceEntry | null>(
      (latest, entry) => (!latest || entry.year > latest.year ? entry : latest),
      null,
    )
  }, [entries, id, year])

  const [form, setForm] = useState<FormState>(() => toFormState(null))
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (hydrated || itemsLoading || entriesLoading) return
    setForm(toFormState(existing))
    setYear(existing?.year ?? null)
    setHydrated(true)
  }, [hydrated, itemsLoading, entriesLoading, existing])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!item || !user) return

    const parsedYear = Number(form.year)
    const next: Record<string, string> = {}
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      next.year = t('entry.yearError')
    }
    const opens = fromInputDate(form.registrationOpensAt)
    const closes = fromInputDate(form.registrationClosesAt)
    if (opens && closes && closes < opens) next.registrationClosesAt = t('entry.closesBeforeOpens')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      // An item from before the races collection has no identity yet, and an
      // entry cannot exist without one.
      const raceId =
        item.raceId ??
        (await findOrCreateRaceId(user.uid, {
          name: item.name,
          location: item.location,
          locationLat: item.locationLat,
          locationLng: item.locationLng,
        }))
      if (!raceId) {
        toast.error(t('entry.saveError'))
        return
      }

      const payload = {
        raceId,
        bucketListItemId: item.id,
        year: parsedYear,
        discipline: form.discipline || undefined,
        entryMethod: form.entryMethod,
        entryStatus: form.entryStatus,
        raceDate: fromInputDate(form.raceDate),
        raceDateConfirmed: form.raceDateConfirmed,
        registrationOpensAt: opens,
        registrationClosesAt: closes,
        lotteryDrawAt: fromInputDate(form.lotteryDrawAt),
        placeConfirmByAt: fromInputDate(form.placeConfirmByAt),
        registrationUrl: form.registrationUrl.trim() || undefined,
        fee: form.fee ? Number(form.fee) : undefined,
        feeCurrency: form.feeCurrency.trim().toUpperCase() || undefined,
        notes: form.notes.trim() || undefined,
      }

      if (existing) {
        await editEntry(existing.id, payload)
      } else {
        await addEntry(payload)
      }
      toast.success(t('entry.saved'))
      navigate('/bucket-list')
    } catch {
      toast.error(t('entry.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (itemsLoading || entriesLoading) {
    return (
      <PageShell title={t('entry.title')}>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden />
      </PageShell>
    )
  }

  if (!item) {
    return (
      <PageShell title={t('entry.title')}>
        <p className="mt-4 text-sm text-muted">{t('entry.itemGone')}</p>
      </PageShell>
    )
  }

  const dateFields: [keyof FormState, string][] = [
    ['raceDate', t('entry.raceDate')],
    ['registrationOpensAt', t('entry.opensAt')],
    ['registrationClosesAt', t('entry.closesAt')],
    ['lotteryDrawAt', t('entry.drawAt')],
    ['placeConfirmByAt', t('entry.placeConfirmByAt')],
  ]

  return (
    <PageShell title={item.name}>
      <p className="mt-2 text-sm text-muted">{t('entry.subtitle')}</p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              {t('entry.year')}
              <input
                type="number"
                value={form.year}
                onChange={(event) => update('year', event.target.value)}
                className={inputClass}
              />
              {errors.year ? <span className="text-xs text-danger">{errors.year}</span> : null}
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('entry.discipline')}
              <select
                value={form.discipline}
                onChange={(event) => update('discipline', event.target.value as EventType | '')}
                className={inputClass}
              >
                <option value="">{t('common.dash')}</option>
                {item.disciplines.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {formatEventTypeLabel(discipline)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('entry.method')}
              <select
                value={form.entryMethod}
                onChange={(event) => update('entryMethod', event.target.value as EntryMethod)}
                className={inputClass}
              >
                {ENTRY_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`entry.methods.${method}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('entry.status')}
              <select
                value={form.entryStatus}
                onChange={(event) => update('entryStatus', event.target.value as EntryStatus)}
                className={inputClass}
              >
                {ENTRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`entry.statuses.${status}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-foreground">{t('entry.dates')}</h2>
          <p className="mt-1 text-xs text-muted">{t('entry.datesHint')}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {dateFields.map(([key, label]) => (
              <label key={key} className="text-sm font-semibold text-foreground">
                {label}
                <input
                  type="date"
                  value={form[key] as string}
                  onChange={(event) => update(key, event.target.value as FormState[typeof key])}
                  className={inputClass}
                />
                {errors[key] ? <span className="text-xs text-danger">{errors[key]}</span> : null}
              </label>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.raceDateConfirmed}
              onChange={(event) => update('raceDateConfirmed', event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            {t('entry.raceDateConfirmed')}
          </label>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('entry.registrationUrl')}
              <input
                value={form.registrationUrl}
                onChange={(event) => update('registrationUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              {t('entry.fee')}
              <input
                type="number"
                value={form.fee}
                onChange={(event) => update('fee', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              {t('entry.feeCurrency')}
              <input
                value={form.feeCurrency}
                maxLength={3}
                onChange={(event) => update('feeCurrency', event.target.value.toUpperCase())}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('common.notes')}
              <textarea
                value={form.notes}
                rows={3}
                onChange={(event) => update('notes', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/bucket-list')}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
