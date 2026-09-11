import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CountrySelect } from '../../components/CountrySelect/CountrySelect'
import { DayField } from './DayField'
import { GateField } from './GateField'
import { CurrencySelect } from '../../components/CurrencySelect/CurrencySelect'
import { PageShell } from '../../components/PageShell/PageShell'
import { TimezoneSelect } from '../../components/TimezoneSelect/TimezoneSelect'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { EVENT_TYPES, type EventType } from '../../domain/eventCodes'
import { formatEventTypeLabel } from '../../i18n/formatters'
import {
  isIsoDay,
  isIsoDayOrInstant,
  RACE_ENTRY_METHODS,
  timezoneFor,
  zonesForCountry,
  type RaceCatalogEdition,
  type RaceCatalogEntry,
  type RaceEntryMethod,
} from '../../../shared/raceCatalog'
import {
  catalogRaceIdExists,
  getCatalogRaceForAdmin,
  saveCatalogRaceForAdmin,
} from '../../services/adminRaceCatalog'

const EMPTY: RaceCatalogEntry = {
  id: '',
  name: '',
  country: '',
  city: '',
  disciplines: [],
  entryMethod: 'unknown',
  review: 'unreviewed',
  source: '',
}

function emptyEdition(): RaceCatalogEdition {
  return {
    year: new Date().getFullYear() + 1,
    source: '',
    confirmedAt: new Date().toISOString().slice(0, 10),
  }
}

/** Kebab-case, because the id is referenced by `races.catalogRaceId` and never changes. */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground'

export function AdminCatalogForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const isEditing = Boolean(id)

  const [race, setRace] = useState<RaceCatalogEntry>(EMPTY)
  /**
   * What the country says about the zone, and what is left to choose from.
   *
   * A zone is a property of the place, so most countries answer on their own
   * and the field never appears. Where a country is really several, the list
   * is that country's own: Portugal is three and the United States
   * twenty-nine, and neither is a text field.
   */
  const derivedZone = useMemo(() => timezoneFor(race.country), [race.country])
  const countryZones = useMemo(() => zonesForCountry(race.country), [race.country])
  /** What an hour on a gate means, and whether one can be stored at all. */
  const raceZone = race.timezone ?? derivedZone
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return

    let cancelled = false
    void (async () => {
      const found = await getCatalogRaceForAdmin(id)
      if (cancelled) return
      if (found) setRace(found)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  function set<K extends keyof RaceCatalogEntry>(key: K, value: RaceCatalogEntry[K]) {
    setRace((current) => ({ ...current, [key]: value }))
  }

  function setEdition(index: number, patch: Partial<RaceCatalogEdition>) {
    setRace((current) => {
      const editions = [...(current.editions ?? [])]
      editions[index] = { ...editions[index]!, ...patch }
      return { ...current, editions }
    })
  }

  async function validate(): Promise<boolean> {
    const next: Record<string, string> = {}
    const id_ = race.id || slugify(race.name)

    if (!race.name.trim()) next.name = t('validation.nameRequired')
    if (!race.city.trim()) next.city = t('validation.locationRequired')
    if (!/^[A-Z]{2}$/.test(race.country)) next.country = t('admin.catalogCountryError')
    if (race.disciplines.length === 0) next.disciplines = t('validation.disciplinesRequired')
    if (!race.source.trim()) next.source = t('admin.catalogSourceError')
    if (!/^[a-z0-9-]+$/.test(id_)) next.id = t('admin.catalogIdError')
    if (!isEditing && (await catalogRaceIdExists(id_))) next.id = t('admin.catalogIdTaken')

    // The rule the review state exists for: dates nobody checked must not be
    // stored as if somebody had.
    if (race.review === 'unreviewed' && (race.editions ?? []).length > 0) {
      next.review = t('admin.catalogUnreviewedEditions')
    }
    for (const edition of race.editions ?? []) {
      if (!edition.source.trim()) next.editions = t('admin.catalogEditionSourceError')
      // A day in the wrong shape is stored, compared as a string by the
      // duplicate rule and handed to `Intl`, which throws on it.
      if (edition.raceDate !== undefined && !isIsoDay(edition.raceDate)) {
        next.editions = t('admin.catalogDateError')
      }
      if (!isIsoDay(edition.confirmedAt)) next.editions = t('admin.catalogDateError')
      if (edition.typicalFee !== undefined && !edition.feeCurrency) {
        next.editions = t('admin.catalogCurrencyError')
      }
      for (const gate of [
        edition.registrationOpensAt,
        edition.registrationClosesAt,
        edition.lotteryDrawAt,
      ]) {
        if (gate !== undefined && !isIsoDayOrInstant(gate)) {
          next.editions = t('admin.catalogGateDateError')
        }
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (!(await validate())) return

    setSaving(true)
    try {
      await saveCatalogRaceForAdmin({ ...race, id: race.id || slugify(race.name) }, user.uid)
      toast.success(t('admin.catalogSaved'))
      navigate('/admin/catalogo')
    } catch {
      toast.error(t('admin.catalogSaveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell title={t('admin.catalogTitle')}>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden />
      </PageShell>
    )
  }

  return (
    <PageShell title={isEditing ? race.name || t('admin.catalogEdit') : t('admin.catalogNew')}>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              {t('admin.catalogName')}
              <input
                value={race.name}
                onChange={(event) => set('name', event.target.value)}
                className={inputClass}
              />
              {errors.name ? <span className="text-xs text-danger">{errors.name}</span> : null}
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('admin.catalogId')}
              <input
                value={race.id}
                disabled={isEditing}
                placeholder={slugify(race.name)}
                onChange={(event) => set('id', event.target.value)}
                className={`${inputClass} disabled:opacity-60`}
              />
              <span className="text-xs text-muted">{t('admin.catalogIdHint')}</span>
              {errors.id ? <span className="block text-xs text-danger">{errors.id}</span> : null}
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('admin.catalogCity')}
              <input
                value={race.city}
                onChange={(event) => set('city', event.target.value)}
                className={inputClass}
              />
              {errors.city ? <span className="text-xs text-danger">{errors.city}</span> : null}
            </label>

            <label className="text-sm font-semibold text-foreground" htmlFor="catalog-country">
              {t('admin.catalogCountry')}
              <CountrySelect
                id="catalog-country"
                value={race.country}
                onChange={(iso) => set('country', iso)}
                className={inputClass}
              />
              {errors.country ? <span className="text-xs text-danger">{errors.country}</span> : null}
            </label>

            <label className="text-sm font-semibold text-foreground" htmlFor="catalog-timezone">
              {t('admin.catalogTimezone')}
              {derivedZone ? (
                // The country answered, so there is nothing to ask and nothing
                // to store: what reads the zone asks the country too.
                <p className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted">
                  {t('admin.catalogTimezoneFromCountry', { zone: derivedZone })}
                </p>
              ) : (
                <>
                  <TimezoneSelect
                    id="catalog-timezone"
                    value={race.timezone ?? ''}
                    onChange={(zone) => set('timezone', zone || undefined)}
                    zones={countryZones}
                    className={inputClass}
                  />
                  <span className="text-xs text-muted">
                    {countryZones.length > 0
                      ? t('admin.catalogTimezoneChoose', { count: countryZones.length })
                      : t('admin.catalogTimezoneAny')}
                  </span>
                </>
              )}
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('admin.catalogEntryMethod')}
              <select
                value={race.entryMethod}
                onChange={(event) => set('entryMethod', event.target.value as RaceEntryMethod)}
                className={inputClass}
              >
                {RACE_ENTRY_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`admin.entryMethod.${method}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-foreground">
              {t('admin.catalogMonth')}
              <select
                value={race.typicalRaceMonth ?? ''}
                onChange={(event) =>
                  set('typicalRaceMonth', event.target.value ? Number(event.target.value) : undefined)
                }
                className={inputClass}
              >
                <option value="">{t('common.dash')}</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('admin.catalogOfficialUrl')}
              <input
                value={race.officialUrl ?? ''}
                onChange={(event) => set('officialUrl', event.target.value || undefined)}
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-foreground sm:col-span-2">
              {t('admin.catalogRegistrationUrl')}
              <input
                value={race.registrationUrl ?? ''}
                onChange={(event) => set('registrationUrl', event.target.value || undefined)}
                className={inputClass}
              />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-foreground">
              {t('admin.catalogDisciplines')}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_TYPES.map((discipline) => {
                const checked = race.disciplines.includes(discipline)
                return (
                  <label key={discipline}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        set(
                          'disciplines',
                          (checked
                            ? race.disciplines.filter((entry) => entry !== discipline)
                            : EVENT_TYPES.filter(
                                (entry) => entry === discipline || race.disciplines.includes(entry),
                              )) as EventType[],
                        )
                      }
                      className="peer sr-only"
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm font-semibold text-muted ring-1 ring-border peer-checked:bg-primary peer-checked:text-white peer-checked:ring-0">
                      {formatEventTypeLabel(discipline)}
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.disciplines ? (
              <span className="mt-1 block text-xs text-danger">{errors.disciplines}</span>
            ) : null}
          </fieldset>

          <label className="mt-4 block text-sm font-semibold text-foreground">
            {t('admin.catalogWindowNote')}
            <textarea
              value={race.typicalWindowNote ?? ''}
              rows={3}
              onChange={(event) => set('typicalWindowNote', event.target.value || undefined)}
              className={inputClass}
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-foreground">
            {t('admin.catalogSource')}
            <input
              value={race.source}
              onChange={(event) => set('source', event.target.value)}
              className={inputClass}
            />
            <span className="text-xs text-muted">{t('admin.catalogSourceHint')}</span>
            {errors.source ? <span className="block text-xs text-danger">{errors.source}</span> : null}
          </label>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={race.review === 'reviewed'}
                onChange={(event) => set('review', event.target.checked ? 'reviewed' : 'unreviewed')}
                className="h-4 w-4 rounded border-border"
              />
              {t('admin.catalogReviewed')}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={race.retired === true}
                onChange={(event) => set('retired', event.target.checked || undefined)}
                className="h-4 w-4 rounded border-border"
              />
              {t('admin.catalogRetired')}
            </label>
          </div>
          {errors.review ? <p className="mt-2 text-xs text-danger">{errors.review}</p> : null}
          <p className="mt-2 text-xs text-muted">{t('admin.catalogReviewHint')}</p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">{t('admin.catalogEditions')}</h2>
            <button
              type="button"
              onClick={() =>
                set('editions', [...(race.editions ?? []), emptyEdition()])
              }
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background"
            >
              {t('admin.catalogAddEdition')}
            </button>
          </div>

          {(race.editions ?? []).length === 0 ? (
            <p className="mt-3 text-xs text-muted">{t('admin.catalogNoEditions')}</p>
          ) : null}

          <div className="mt-4 space-y-4">
            {(race.editions ?? []).map((edition, index) => (
              <div key={index} className="rounded-md border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-muted">
                    {t('admin.catalogEditionYear')}
                    <input
                      type="number"
                      value={edition.year}
                      onChange={(event) => setEdition(index, { year: Number(event.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <div className="text-xs font-semibold text-muted">
                    <label htmlFor={`edition-race-date-${index}`}>
                      {t('admin.catalogRaceDate')}
                    </label>
                    <DayField
                      id={`edition-race-date-${index}`}
                      value={edition.raceDate}
                      onChange={(day) => setEdition(index, { raceDate: day })}
                    />
                  </div>
                  <GateField
                    id={`edition-registrationopensat-${index}`}
                    label={t('admin.catalogOpensAt')}
                    value={edition.registrationOpensAt}
                    zone={raceZone}
                    onChange={(value) => setEdition(index, { registrationOpensAt: value })}
                  />
                  <GateField
                    id={`edition-registrationclosesat-${index}`}
                    label={t('admin.catalogClosesAt')}
                    value={edition.registrationClosesAt}
                    zone={raceZone}
                    onChange={(value) => setEdition(index, { registrationClosesAt: value })}
                  />
                  <GateField
                    id={`edition-lotterydrawat-${index}`}
                    label={t('admin.catalogDrawAt')}
                    value={edition.lotteryDrawAt}
                    zone={raceZone}
                    onChange={(value) => setEdition(index, { lotteryDrawAt: value })}
                  />
                  <label className="text-xs font-semibold text-muted">
                    {t('admin.catalogFee')}
                    <input
                      type="number"
                      value={edition.typicalFee ?? ''}
                      onChange={(event) =>
                        setEdition(index, {
                          typicalFee: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label
                    className="text-xs font-semibold text-muted"
                    htmlFor={`edition-currency-${index}`}
                  >
                    {t('admin.catalogCurrency')}
                    <CurrencySelect
                      id={`edition-currency-${index}`}
                      value={edition.feeCurrency ?? ''}
                      onChange={(currency) =>
                        setEdition(index, { feeCurrency: currency || undefined })
                      }
                      className={inputClass}
                    />
                  </label>
                  <div className="text-xs font-semibold text-muted">
                    <label htmlFor={`edition-confirmed-${index}`}>
                      {t('admin.catalogConfirmedAt')}
                    </label>
                    <DayField
                      id={`edition-confirmed-${index}`}
                      value={edition.confirmedAt}
                      onChange={(day) =>
                        setEdition(index, { confirmedAt: day ?? new Date().toISOString().slice(0, 10) })
                      }
                    />
                  </div>
                  <label className="text-xs font-semibold text-muted sm:col-span-3">
                    {t('admin.catalogResultsUrl')}
                    <input
                      value={edition.resultsUrl ?? ''}
                      placeholder="https://"
                      onChange={(event) =>
                        setEdition(index, { resultsUrl: event.target.value || undefined })
                      }
                      className={inputClass}
                    />
                    <span className="text-xs text-muted">{t('admin.catalogResultsUrlHint')}</span>
                  </label>
                  <label className="text-xs font-semibold text-muted sm:col-span-3">
                    {t('admin.catalogEditionSource')}
                    <input
                      value={edition.source}
                      onChange={(event) => setEdition(index, { source: event.target.value })}
                      className={inputClass}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    set(
                      'editions',
                      (race.editions ?? []).filter((_, position) => position !== index),
                    )
                  }
                  className="mt-3 text-xs font-semibold text-danger"
                >
                  {t('admin.catalogRemoveEdition')}
                </button>
              </div>
            ))}
          </div>
          {errors.editions ? <p className="mt-2 text-xs text-danger">{errors.editions}</p> : null}
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/catalogo')}
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
