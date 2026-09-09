import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchToken, type RaceCatalogEntry } from '../../../shared/raceCatalog'
import { formatDatePt } from '../../utils/date'
import { searchRaceCatalog } from '../../services/raceCatalog'
import { identifyRaceInCatalog } from '../../services/raceIdentity'
import type { Event } from '../../types/Event'

/**
 * How many candidates are worth showing. More than this and the answer is to
 * type a better word, not to scroll.
 */
const LIMIT = 6

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

  if (linked) return null

  const search = async (typed: string) => {
    const nameToken = searchToken(typed)
    if (!nameToken) {
      setCandidates([])
      return
    }
    setSearching(true)
    setError(null)
    try {
      const found = await searchRaceCatalog({ nameToken, from: ANY_DATE, limit: LIMIT })
      setCandidates(found)
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
            run. Proposing a new entry is the other half of this and is not
            built yet, so this says so rather than pretending. */}
        <span className="text-xs text-muted">{t('identifyInCatalog.notThere')}</span>
      </div>
    </section>
  )
}
