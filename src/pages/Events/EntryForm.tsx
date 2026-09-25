import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { DayField } from '../../components/DatePicker'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useRaceEntries } from '../../hooks/useRaceEntries'
import { useRaces } from '../../hooks/useRaces'
import { CurrencySelect } from '../../components/CurrencySelect/CurrencySelect'
import { prefillFromCatalog, type EntryPrefill } from '../../domain/entryPrefill'
import { getEvent, updateEvent } from '../../services/events'
import { reportEditionFee } from '../../services/editionReports'
import { loadCatalogRace } from '../../services/raceCatalog'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { Event } from '../../types/Event'
import {
  ENTRY_METHODS,
  ENTRY_STATUSES,
  type EntryMethod,
  type EntryStatus,
  type RaceEntry,
} from '../../types/RaceEntry'

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground'

/** `YYYY-MM-DD`, the form's day value, or empty for no date. */
function toInputDate(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : ''
}

function fromInputDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

type FormState = {
  entryMethod: EntryMethod
  entryStatus: EntryStatus
  registrationOpensAt: string
  registrationClosesAt: string
  lotteryDrawAt: string
  placeConfirmByAt: string
  registrationUrl: string
  fee: string
  feeCurrency: string
  notes: string
}

/**
 * @param offer what the catalog knows, and only ever for an attempt that is new.
 *
 * Nothing for one that exists: a field the runner cleared on purpose is an
 * answer, and a suggestion has no business overwriting it a week later.
 */
function toFormState(entry: RaceEntry | null, offer: EntryPrefill | null = null): FormState {
  return {
    entryMethod: entry?.entryMethod ?? offer?.entryMethod ?? 'unknown',
    entryStatus: entry?.entryStatus ?? 'watching',
    registrationOpensAt:
      toInputDate(entry?.registrationOpensAt) || (offer?.registrationOpensAt ?? ''),
    registrationClosesAt:
      toInputDate(entry?.registrationClosesAt) || (offer?.registrationClosesAt ?? ''),
    lotteryDrawAt: toInputDate(entry?.lotteryDrawAt) || (offer?.lotteryDrawAt ?? ''),
    placeConfirmByAt: toInputDate(entry?.placeConfirmByAt),
    registrationUrl: entry?.registrationUrl ?? offer?.registrationUrl ?? '',
    fee:
      entry?.fee !== undefined
        ? String(entry.fee)
        : offer?.fee !== undefined
          ? String(offer.fee)
          : '',
    feeCurrency: entry?.feeCurrency ?? offer?.feeCurrency ?? '',
    notes: entry?.notes ?? '',
  }
}

/**
 * The paperwork of getting into one race, for the races that have any.
 *
 * Reached from a race already in the calendar, and only when somebody says it
 * has deadlines: a lottery, a window that opens at nine in the morning, a place
 * that has to be paid for by a date. Most races have none of that, and for them
 * the calendar is the whole story.
 *
 * It asks nothing the event already answers. The year is the year of the race,
 * the distance is the event's, and the race date is the day it is scheduled
 * for, which is why scheduling requires a real one.
 */
export function EntryForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { entries, loading: entriesLoading, addEntry, editEntry } = useRaceEntries()
  const { races } = useRaces()

  const [event, setEvent] = useState<Event | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void getEvent(id)
      .then((found) => {
        if (!cancelled) setEvent(found)
      })
      .finally(() => {
        if (!cancelled) setLoadingEvent(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const year = event ? event.date.getFullYear() : null
  const existing = useMemo(() => {
    if (!event?.raceId || year === null) return null
    return entries.find((entry) => entry.raceId === event.raceId && entry.year === year) ?? null
  }, [entries, event?.raceId, year])

  const catalogRaceId = races.find((race) => race.id === event?.raceId)?.catalogRaceId
  const [catalogRace, setCatalogRace] = useState<RaceCatalogEntry | null>(null)
  const [catalogSettled, setCatalogSettled] = useState(false)

  useEffect(() => {
    if (loadingEvent) return
    if (!catalogRaceId) {
      setCatalogSettled(true)
      return
    }
    void loadCatalogRace(catalogRaceId).then((entry) => {
      setCatalogRace(entry)
      setCatalogSettled(true)
    })
  }, [catalogRaceId, loadingEvent])

  /**
   * What the catalog can fill in, for the year this race is scheduled in.
   *
   * The year is known here, unlike before, so the offer is about the edition
   * being run rather than whichever one happens to be next.
   */
  const offer = useMemo(
    () => (existing || year === null ? null : prefillFromCatalog(catalogRace, { year })),
    [catalogRace, existing, year],
  )

  const [form, setForm] = useState<FormState>(() => toFormState(null))
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // The catalog has to have settled first, or the form hydrates empty and the
    // suggestion arrives too late to be in it.
    if (hydrated || loadingEvent || entriesLoading || !catalogSettled) return
    setForm(toFormState(existing, offer))
    setHydrated(true)
  }, [hydrated, loadingEvent, entriesLoading, existing, offer, catalogSettled])

  /**
   * Whether to ask this runner what they paid.
   *
   * No calendar we read publishes a fee: measured across 5116 catalog entries,
   * 140 carry one. The runner who just got in is the only one who knows, and
   * this is the only moment they know it. Asked, never required.
   */
  const catalogFee = catalogRace?.editions?.find((edition) => edition.year === year)?.typicalFee
  const askForFee =
    form.entryStatus === 'registered' &&
    !form.fee.trim() &&
    Boolean(catalogRaceId) &&
    catalogFee === undefined
  // A fee with no currency is dropped on the way to the catalog, silently.
  const feeNeedsCurrency = Boolean(form.fee.trim()) && !form.feeCurrency.trim()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(submitted: FormEvent) {
    submitted.preventDefault()
    if (!event || !user || year === null) return

    const next: Record<string, string> = {}
    const opens = fromInputDate(form.registrationOpensAt)
    const closes = fromInputDate(form.registrationClosesAt)
    if (opens && closes && closes < opens) next.registrationClosesAt = t('entry.closesBeforeOpens')

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      const payload = {
        raceId: event.raceId!,
        year,
        discipline: event.eventType,
        eventId: event.id,
        // The day is the day the race is scheduled for. Nothing is scheduled
        // without one, so this is never a guess.
        raceDate: event.date,
        raceDateConfirmed: true,
        entryMethod: form.entryMethod,
        entryStatus: form.entryStatus,
        registrationOpensAt: opens,
        // The zone belongs to the opening time: a reminder has to print the
        // hour the organiser meant, not the runner's.
        ...(opens && offer?.timezone ? { registrationOpensTimezone: offer.timezone } : {}),
        registrationClosesAt: closes,
        lotteryDrawAt: fromInputDate(form.lotteryDrawAt),
        placeConfirmByAt: fromInputDate(form.placeConfirmByAt),
        registrationUrl: form.registrationUrl.trim() || undefined,
        fee: form.fee ? Number(form.fee) : undefined,
        feeCurrency: form.feeCurrency.trim().toUpperCase() || undefined,
        notes: form.notes.trim() || undefined,
      }

      if (existing) await editEntry(existing.id, payload)
      else await addEntry(payload)

      // Being in is what `confirmed` means on the calendar, and saying it twice
      // is how the two drift apart.
      if (form.entryStatus === 'registered' && event.status === 'planned') {
        await updateEvent(event.id, { status: 'confirmed' })
      }

      // No source we read publishes a fee, so a runner who got in is the only
      // one who can tell the catalog what it costs.
      if (
        form.entryStatus === 'registered' &&
        catalogRaceId &&
        payload.fee !== undefined &&
        payload.feeCurrency
      ) {
        await reportEditionFee(user.uid, catalogRaceId, year, payload.fee, payload.feeCurrency)
      }

      toast.success(t('entry.saved'))
      navigate(`/eventos/${event.id}`)
    } catch {
      toast.error(t('entry.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loadingEvent || entriesLoading) {
    return (
      <PageShell title={t('entry.title')}>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden />
      </PageShell>
    )
  }

  if (!event || !event.raceId) {
    return (
      <PageShell title={t('entry.title')}>
        <p className="mt-4 text-sm text-muted">{t('entry.eventGone')}</p>
      </PageShell>
    )
  }

  const dateFields: [keyof FormState, string][] = [
    ['registrationOpensAt', t('entry.opensAt')],
    ['registrationClosesAt', t('entry.closesAt')],
    ['lotteryDrawAt', t('entry.drawAt')],
    ['placeConfirmByAt', t('entry.placeConfirmByAt')],
  ]

  return (
    <PageShell title={event.name}>
      <p className="mt-2 text-sm text-muted">{t('entry.subtitle')}</p>

      {/* An unreviewed entry may fill a field the runner can see and correct,
          and may never assert. Saying where the values came from is what makes
          the difference visible. */}
      {offer && !existing ? (
        <p className="mt-3 rounded-md border border-border bg-surface px-4 py-2 text-xs text-muted">
          {t(offer.assertable ? 'entry.prefilledReviewed' : 'entry.prefilled', {
            source: offer.source.split(',')[0]?.trim() ?? offer.source,
          })}
        </p>
      ) : null}

      <form onSubmit={(submitted) => void handleSubmit(submitted)} className="mt-6 space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              {t('entry.method')}
              <select
                value={form.entryMethod}
                onChange={(changed) => update('entryMethod', changed.target.value as EntryMethod)}
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
                onChange={(changed) => update('entryStatus', changed.target.value as EntryStatus)}
                className={inputClass}
              >
                {ENTRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`entry.statuses.${status}`)}
                  </option>
                ))}
              </select>
              {form.entryStatus === 'registered' && event.status === 'planned' ? (
                <span className="mt-1 block text-xs font-normal text-primary">
                  {t('entry.registeredConfirmsEvent')}
                </span>
              ) : null}
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
                <DayField
                  value={(form[key] as string) || undefined}
                  onChange={(day) => update(key, (day ?? '') as FormState[typeof key])}
                  hasError={Boolean(errors[key])}
                />
                {errors[key] ? <span className="text-xs text-danger">{errors[key]}</span> : null}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('entry.registrationUrl')}
              <input
                value={form.registrationUrl}
                onChange={(changed) => update('registrationUrl', changed.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-foreground">
              {t('entry.fee')}
              <input
                type="number"
                value={form.fee}
                onChange={(changed) => update('fee', changed.target.value)}
                className={inputClass}
              />
              {askForFee ? (
                <span className="mt-1 block text-xs font-normal text-primary">
                  {t('entry.feeAsk')}
                </span>
              ) : null}
            </label>
            <label className="text-sm font-semibold text-foreground" htmlFor="entry-fee-currency">
              {t('entry.feeCurrency')}
              <CurrencySelect
                id="entry-fee-currency"
                value={form.feeCurrency}
                onChange={(currency) => update('feeCurrency', currency)}
                className={inputClass}
              />
              {feeNeedsCurrency ? (
                <span className="mt-1 block text-xs font-normal text-primary">
                  {t('entry.feeNeedsCurrency')}
                </span>
              ) : null}
            </label>
            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('common.notes')}
              <textarea
                value={form.notes}
                rows={3}
                onChange={(changed) => update('notes', changed.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/eventos/${event.id}`)}
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
