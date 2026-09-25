import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchTokens, type RaceCatalogEntry } from '../../../shared/raceCatalog'
import { formatDatePt } from '../../utils/date'
import { searchRaceCatalog } from '../../services/raceCatalog'
import { identifyWishInCatalog } from '../../services/raceIdentity'
import type { BucketListItem } from '../../types/BucketListItem'
import type { Race } from '../../types/Race'

/** More than this and the answer is a better word, not more scrolling. */
const LIMIT = 6

/**
 * Early enough to find a race whose next edition has already passed.
 *
 * The catalog search orders by the next running and skips what has no date
 * ahead. Saying which race a wish is wants the entry either way.
 */
const ANY_DATE = '1000-01-01'

/**
 * The wishes that do not say which catalog race they are, and a way to say it.
 *
 * A wish typed by hand is a name and nothing else: it cannot offer next
 * season's dates, cannot be recognised as the race already in the calendar,
 * and cannot become a marker on a catalog entry. Measured on a real instance,
 * 15 of 16 wishes were exactly that.
 *
 * The runner picks, as they do for an event. A name comparison is good enough
 * to offer six candidates and nowhere near good enough to attach somebody's
 * race to an entry by itself.
 */
export function LinkWishesToCatalog({
  items,
  races,
  userId,
  onLinked,
}: {
  items: readonly BucketListItem[]
  races: readonly Race[]
  userId: string
  /** Called after a link is written, so the page can read the wish again. */
  onLinked?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState<BucketListItem | null>(null)
  const [candidates, setCandidates] = useState<RaceCatalogEntry[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Linked in this session: the wish arrives again before the write lands. */
  const [done, setDone] = useState<string[]>([])

  const byId = new Map(races.map((race) => [race.id, race]))
  const pending = items.filter(
    (item) =>
      !done.includes(item.id) && !(item.raceId ? byId.get(item.raceId)?.catalogRaceId : undefined),
  )

  if (pending.length === 0) return null

  const ask = async (item: BucketListItem) => {
    setAsking(item)
    setCandidates(null)
    setError(null)
    const nameTokens = searchTokens(item.name ?? '')
    if (nameTokens.length === 0) {
      setCandidates([])
      return
    }
    setSearching(true)
    try {
      const found = await searchRaceCatalog({ nameTokens, from: ANY_DATE, limit: LIMIT })
      // The distance breaks the tie a name cannot: "Maratona de Lisboa" and
      // "Meia Maratona de Lisboa" agree on every word but one.
      const offersThis = (entry: RaceCatalogEntry) =>
        Number((item.disciplines ?? []).some((discipline) => entry.disciplines.includes(discipline)))
      setCandidates([...found].sort((left, right) => offersThis(right) - offersThis(left)))
    } catch {
      setError(t('linkWishes.searchError'))
    } finally {
      setSearching(false)
    }
  }

  const pick = async (item: BucketListItem, entry: RaceCatalogEntry) => {
    setSaving(true)
    setError(null)
    try {
      await identifyWishInCatalog(userId, item, entry.id)
      setDone((current) => [...current, item.id])
      setAsking(null)
      setCandidates(null)
      onLinked?.()
    } catch {
      setError(t('linkWishes.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-lg border border-dashed border-border px-4 py-3 text-left text-xs text-muted hover:border-primary hover:text-primary"
      >
        {t('linkWishes.offer', { count: pending.length })}
      </button>
    )
  }

  return (
    <section className="mt-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('linkWishes.title', { count: pending.length })}
      </h2>
      <p className="mt-1 text-xs text-muted">{t('linkWishes.hint')}</p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <ul className="mt-3 divide-y divide-border">
        {pending.map((item) => (
          <li key={item.id} className="py-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-foreground">{item.name}</span>
              <span className="text-xs text-muted">{item.location}</span>
              <button
                type="button"
                disabled={searching || saving}
                onClick={() => void ask(item)}
                className="ml-auto rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
              >
                {t('linkWishes.which')}
              </button>
            </div>

            {asking?.id === item.id ? (
              searching ? (
                <p className="mt-2 text-xs text-muted">{t('common.loading')}</p>
              ) : candidates && candidates.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {candidates.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground">{entry.name}</span>
                      <span className="text-muted">
                        {[entry.city, entry.country].filter(Boolean).join(', ')}
                      </span>
                      {entry.nextRaceDate ? (
                        <span className="text-muted">
                          {formatDatePt(new Date(`${entry.nextRaceDate}T12:00:00`))}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void pick(item, entry)}
                        className="ml-auto rounded-md border border-primary px-2 py-1 font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        {t('linkWishes.pick')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                // A wish has no date, and a proposal to the catalog needs one,
                // so there is nothing to offer here beyond saying so.
                <p className="mt-2 text-xs text-muted">{t('linkWishes.none')}</p>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
