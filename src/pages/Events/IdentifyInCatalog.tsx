import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchTokens, type RaceCatalogEntry } from '../../../shared/raceCatalog'
import { toIsoCountry } from '../../../shared/eventDiscovery/countries'
import { proposeCatalogRace } from '../../services/catalogProposals'
import { formatDatePt } from '../../utils/date'
import { searchRaceCatalog } from '../../services/raceCatalog'
import { identifyRaceInCatalog } from '../../services/raceIdentity'
import type { Event } from '../../types/Event'

/**
 * How many candidates are worth showing. More than this and the answer is to
 * type a better word, not to scroll.
 */
const LIMIT = 6

/** The local day, because the day a race was run is a calendar fact. */
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * A date early enough to find an entry whose next edition has already passed.
 *
 * The search exists to order races by when they are next run and skips
 * anything with no date ahead. Identifying a race is the opposite question:
 * the entry is wanted whether or not its next edition is known.
 */
const ANY_DATE = '1000-01-01'

/**
 * Says which race in the shared catalog this event is a running of.
 *
 * Only shown when nothing says so yet. Without the link, the catalog cannot
 * fill in next year's dates and this runner's verified result cannot correct
 * the day for anybody else: the chain from an event to the shared entry runs
 * through `races.catalogRaceId`, and that is only written when a race is added
 * through the discovery page.
 *
 * The runner picks. A name comparison is good enough to offer candidates and
 * nowhere near good enough to attach somebody's history to a race by itself.
 */
export function IdentifyInCatalog({
  event,
  userId,
  linked,
}: {
  event: Event
  userId: string
  /** True once the event's race points at a catalog entry. */
  linked: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState(event.name)
  const [candidates, setCandidates] = useState<RaceCatalogEntry[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposing, setProposing] = useState(false)
  const [proposed, setProposed] = useState(false)
  /** "Brandenburger Tor, Berlim" is a location and not a town and a country. */
  const [city, setCity] = useState(() => event.location.split(',')[0]?.trim() ?? '')
  const [country, setCountry] = useState('')

  if (linked) return null

  // A proposal is the end of this, not a step in it: leaving the search open
  // read as though something else was still expected.
  if (proposed) {
    return (
      <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted">
        {t('identifyInCatalog.proposed')}
      </p>
    )
  }

  const propose = async () => {
    const iso = toIsoCountry(country)
    if (!iso) {
      setError(t('identifyInCatalog.countryError'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await proposeCatalogRace(userId, {
        name: event.name,
        city,
        country: iso,
        raceDate: toIsoDay(event.date),
        disciplines: [event.eventType],
      })
      setProposing(false)
      setProposed(true)
    } catch {
      setError(t('identifyInCatalog.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const search = async (typed: string) => {
    const nameTokens = searchTokens(typed)
    if (nameTokens.length === 0) {
      setCandidates([])
      return
    }
    setSearching(true)
    setError(null)
    try {
      const found = await searchRaceCatalog({ nameTokens, from: ANY_DATE, limit: LIMIT })
      // The distance breaks a tie the name cannot. "Maratona de Lisboa" and
      // "Meia Maratona de Lisboa" agree on every word but one, and this event
      // knows which of the two it ran. Stable, so the name ranking survives
      // inside each half.
      const offersThis = (entry: RaceCatalogEntry) =>
        Number(entry.disciplines.includes(event.eventType))
      setCandidates([...found].sort((left, right) => offersThis(right) - offersThis(left)))
    } catch {
      setError(t('identifyInCatalog.searchError'))
    } finally {
      setSearching(false)
    }
  }

  const pick = async (entry: RaceCatalogEntry) => {
    setSaving(true)
    setError(null)
    try {
      await identifyRaceInCatalog(userId, event, entry.id)
      setOpen(false)
    } catch {
      setError(t('identifyInCatalog.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          void search(event.name)
        }}
        className="mt-4 w-full rounded-lg border border-dashed border-border px-4 py-3 text-left text-xs text-muted hover:border-primary hover:text-primary"
      >
        {t('identifyInCatalog.offer')}
      </button>
    )
  }

  return (
    <section className="mt-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">{t('identifyInCatalog.title')}</p>
      <p className="mt-1 text-xs text-muted">{t('identifyInCatalog.why')}</p>

      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(submit) => {
          submit.preventDefault()
          void search(term)
        }}
      >
        <label className="sr-only" htmlFor="identify-term">
          {t('identifyInCatalog.search')}
        </label>
        <input
          id="identify-term"
          value={term}
          onChange={(change) => setTerm(change.target.value)}
          placeholder={t('identifyInCatalog.search')}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
        >
          {t('identifyInCatalog.search')}
        </button>
      </form>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      {searching ? (
        <p className="mt-3 text-xs text-muted">{t('common.loading')}</p>
      ) : candidates?.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t('identifyInCatalog.noneFound')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(candidates ?? []).map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {entry.name}
              </span>
              <span className="text-xs text-muted">
                {[entry.city, entry.country].filter(Boolean).join(', ')}
              </span>
              {entry.nextRaceDate ? (
                <span className="text-xs text-muted">
                  {formatDatePt(new Date(entry.nextRaceDate))}
                </span>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => void pick(entry)}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {t('identifyInCatalog.pick')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-muted hover:text-foreground"
        >
          {t('common.cancel')}
        </button>
        {/* The catalog holds five thousand races and not every race anybody has
            run. A race no calendar publishes has no other way in. */}
        {proposing ? null : (
          <button
            type="button"
            onClick={() => setProposing(true)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t('identifyInCatalog.propose')}
          </button>
        )}
      </div>

      {proposing ? (
        <form
          className="mt-3 space-y-3 border-t border-border pt-3"
          onSubmit={(submit) => {
            submit.preventDefault()
            void propose()
          }}
        >
          <p className="text-xs text-muted">{t('identifyInCatalog.proposeWhy')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-foreground">
              {t('identifyInCatalog.town')}
              <input
                value={city}
                onChange={(change) => setCity(change.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-xs font-semibold text-foreground">
              {t('identifyInCatalog.country')}
              <input
                value={country}
                onChange={(change) => setCountry(change.target.value)}
                placeholder={t('identifyInCatalog.countryHint')}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t('identifyInCatalog.proposeSubmit')}
          </button>
        </form>
      ) : null}

    </section>
  )
}
