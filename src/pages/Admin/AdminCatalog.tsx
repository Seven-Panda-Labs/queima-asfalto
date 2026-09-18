import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import {
  RETIRED_REASONS,
  SNOOZE_DAYS,
  type RaceCatalogEntry,
  type RetiredReason,
  type SnoozeDays,
} from '../../../shared/raceCatalog'
import { useAuth } from '../../contexts/AuthContext'
import {
  askAgainAboutRaces,
  countStaleForAdmin,
  keepAsRunningRaces,
  listStaleForAdmin,
  loadOtherSportsForAdmin,
  mergeCatalogRaces,
  retireCatalogRaces,
  searchCatalogForAdmin,
  snoozeCatalogRaces,
  unmergeCatalogRace,
  unretireCatalogRaces,
  unsnoozeCatalogRaces,
  type StaleCursor,
} from '../../services/adminRaceCatalog'
import { AdminTabs } from './AdminTabs'
import { CatalogDuplicates } from './CatalogDuplicates'
import { CatalogProposals } from './CatalogProposals'

function nextEdition(race: RaceCatalogEntry): string | null {
  const dated = (race.editions ?? []).filter((edition) => edition.raceDate)
  const sorted = [...dated].sort((left, right) => (left.raceDate! < right.raceDate! ? 1 : -1))
  return sorted[0]?.raceDate ?? null
}

/** A page of work. Fifty is what fits before scrolling stops being reading. */
const PAGE_SIZE = 50

/**
 * Two flows, because they are two jobs.
 *
 * The queue is the work: entries whose last known date has passed and which
 * nobody has read a new season for, a page at a time. Searching the whole
 * catalog is the other job, for when one entry is wrong, and it happens on
 * demand rather than by downloading five thousand documents on every visit.
 */
export function AdminCatalog() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stale, setStale] = useState<RaceCatalogEntry[]>([])
  /**
   * Where the next page starts, or nothing when there is no next page.
   *
   * It was a list that only ever grew: the last page brings no cursor, the
   * list kept the one before it, and "show more" stayed on screen asking for
   * the same page again, appending it to the list and to the count, forever.
   */
  const [next, setNext] = useState<StaleCursor | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [term, setTerm] = useState('')
  const [found, setFound] = useState<RaceCatalogEntry[] | null>(null)
  const [searching, setSearching] = useState(false)
  /**
   * The entry an operator has picked as the repeated one.
   *
   * Two clicks and not one, because the two entries are hardly ever in the
   * same list: "S 25 Berlin" is found by the word Olympiastadion and "S 25
   * Berlin 2027" by the year, so the pick has to survive the next search. Until
   * now nothing merged two entries by hand at all: the queue was the only way,
   * and it cannot see a pair whose name has no word left once the town is out.
   */
  const [joining, setJoining] = useState<RaceCatalogEntry | null>(null)
  const [joined, setJoined] = useState<string | null>(null)
  /**
   * The entries an operator has ticked, by id, across both lists.
   *
   * By id rather than by row, because the two lists are two queries and the
   * same race can be in either: a sweep starts in the search and finishes in
   * the queue without losing what was already picked.
   */
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState<RetiredReason | ''>('')
  /** How long the ticked entries are put off for, once somebody picks it. */
  const [snooze, setSnooze] = useState<SnoozeDays>(SNOOZE_DAYS[1])
  /**
   * How many races are waiting, counted by the server.
   *
   * Not the rows on screen. Those grew with every "show more", so the heading
   * said 44, then 81, then 124, and never what the work was.
   */
  const [waiting, setWaiting] = useState<number | null>(null)
  /** What the last decision touched, kept so it can be taken back in one press. */
  const [swept, setSwept] = useState<string[]>([])
  const [sweptKind, setSweptKind] = useState<'retired' | 'kept' | 'snoozed'>('retired')
  /** What reads as another sport, asked for when somebody wants to sweep. */
  const [otherSports, setOtherSports] = useState<RaceCatalogEntry[] | null>(null)
  const [reading, setReading] = useState(false)
  const [sweeping, setSweeping] = useState(false)

  const load = useCallback(
    async (after?: StaleCursor) => {
      setLoading(true)
      setError(null)
      try {
        const page = await listStaleForAdmin(PAGE_SIZE, after)
        setStale((current) => (after ? [...current, ...page.races] : page.races))
        setNext(page.nextCursor)
        // Only when the list starts over: paging through does not change how
        // many are waiting, and asking again would only cost a round trip.
        if (!after) void countStaleForAdmin().then(setWaiting).catch(() => setWaiting(null))
        return page.nextCursor
      } catch {
        setError(t('admin.catalogLoadError'))
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  useEffect(() => {
    void load()
  }, [load])

  const search = async () => {
    if (!term.trim()) {
      setFound(null)
      return
    }
    setSearching(true)
    try {
      setFound(await searchCatalogForAdmin(term, PAGE_SIZE))
    } catch {
      setError(t('admin.catalogLoadError'))
    } finally {
      setSearching(false)
    }
  }

  const readOtherSports = async () => {
    setReading(true)
    setError(null)
    try {
      setOtherSports(await loadOtherSportsForAdmin())
    } catch {
      setError(t('admin.catalogLoadError'))
    } finally {
      setReading(false)
    }
  }

  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  /** Takes every ticked entry out of the catalog, with the same reason. */
  const sweep = async () => {
    if (!user || !reason || picked.size === 0) return
    const ids = [...picked]
    setSweeping(true)
    setError(null)
    try {
      await retireCatalogRaces(ids, reason, user.uid)
      setPicked(new Set())
      setReason('')
      setSwept(ids)
      setSweptKind('retired')
      if (found) void search()
      setStale([])
      setNext(undefined)
      await load()
    } catch {
      setError(t('admin.duplicatesError'))
    } finally {
      setSweeping(false)
    }
  }

  /** Asks about the ticked entries again later, so the rest can be read now. */
  const putOff = async () => {
    if (!user || picked.size === 0) return
    const ids = [...picked]
    setSweeping(true)
    setError(null)
    try {
      await snoozeCatalogRaces(ids, snooze, user.uid)
      setPicked(new Set())
      setSwept(ids)
      setSweptKind('snoozed')
      setStale([])
      setNext(undefined)
      await load()
    } catch {
      setError(t('admin.duplicatesError'))
    } finally {
      setSweeping(false)
    }
  }

  /** Says the picked entries are races, so the list stops asking about them. */
  const keep = async () => {
    if (!user || picked.size === 0) return
    const ids = [...picked]
    setSweeping(true)
    setError(null)
    try {
      await keepAsRunningRaces(ids, user.uid)
      setPicked(new Set())
      setSwept(ids)
      setSweptKind('kept')
      if (otherSports) void readOtherSports()
    } catch {
      setError(t('admin.duplicatesError'))
    } finally {
      setSweeping(false)
    }
  }

  /** Puts back what the last decision did, for when it went too wide. */
  const undoSweep = async () => {
    if (!user || swept.length === 0) return
    setSweeping(true)
    try {
      if (sweptKind === 'kept') await askAgainAboutRaces(swept, user.uid)
      else if (sweptKind === 'snoozed') await unsnoozeCatalogRaces(swept, user.uid)
      else await unretireCatalogRaces(swept, user.uid)
      if (otherSports) void readOtherSports()
      setSwept([])
      if (found) void search()
      setStale([])
      setNext(undefined)
      await load()
    } catch {
      setError(t('admin.duplicatesError'))
    } finally {
      setSweeping(false)
    }
  }

  /** Points the picked entry at this one, which is the survivor. */
  const join = async (survivor: RaceCatalogEntry) => {
    const dropped = joining
    if (!dropped || !user) return
    // A copy of a copy answers no question: the chain has to end somewhere.
    if (survivor.duplicateOfCatalogRaceId) {
      setError(t('admin.catalogJoinCopy', { name: survivor.duplicateOfCatalogRaceId }))
      return
    }
    setError(null)
    try {
      await mergeCatalogRaces(survivor.id, dropped.id, user.uid)
      setJoining(null)
      setJoined(t('admin.catalogJoined', { drop: dropped.name, keep: survivor.name }))
      if (found) void search()
      setStale([])
      setNext(undefined)
      await load()
    } catch {
      setError(t('admin.duplicatesError'))
    }
  }

  /**
   * One row, shared by the queue and the search: the same entry, two ways in.
   *
   * A copy looks quieter than the entry it points at. Four S25 rows sat side
   * by side, one of them the catalog's answer and three of them not, and the
   * only thing that said which was the button on the right. The name and the
   * background go muted rather than transparent, so the buttons stay legible.
   */
  const row = (race: RaceCatalogEntry) => {
    // Neither a copy nor a retired entry is what the catalog answers with, so
    // neither should read like the row beside it that is. The attribute says
    // which of the two it is, because the reason is worth knowing and a class
    // is not a promise.
    const quiet = race.duplicateOfCatalogRaceId ? 'merged' : race.retired ? 'retired' : undefined
    return (
      <li
        key={race.id}
        data-quiet={quiet}
        className={`flex flex-wrap items-center gap-3 px-4 py-3${quiet ? ' bg-border/20' : ''}`}
      >
        {/* Only what is still in the catalog can be taken out of it. */}
        {user && !quiet ? (
          <input
            type="checkbox"
            checked={picked.has(race.id)}
            onChange={() => toggle(race.id)}
            aria-label={t('admin.catalogPick', { name: race.name })}
            className="h-4 w-4 shrink-0 rounded border-border"
          />
        ) : null}
        <Link
          to={`/admin/catalogo/${race.id}`}
          className={`font-semibold hover:text-primary ${quiet ? 'text-muted' : 'text-foreground'}`}
        >
          {race.name}
        </Link>
        {/* The work on this list is reading the next season off the
            organiser's own page, and that was a visit to the form and a copy
            of the URL. */}
        {race.officialUrl ? (
          <a
            href={race.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={race.officialUrl}
            aria-label={t('admin.catalogOpenOfficial', { name: race.name })}
            className="shrink-0 rounded px-1 text-primary hover:bg-primary/10"
          >
            🔗
          </a>
        ) : null}
        <span className="text-xs text-muted">
          {race.city}, {race.country}
        </span>
        <span className="text-xs text-muted">{t(`admin.entryMethod.${race.entryMethod}`)}</span>
        {race.retired ? (
          <span className="rounded bg-border px-1.5 py-0.5 text-xs text-muted">
            {t('admin.catalogGroup.retired', { count: 1 })}
          </span>
        ) : null}
        <span className="ml-auto text-xs tabular-nums text-muted">
          {nextEdition(race) ?? t('admin.catalogNoEdition')}
        </span>
        {user && !race.duplicateOfCatalogRaceId && !joining ? (
          <button
            type="button"
            onClick={() => {
              setJoined(null)
              setJoining(race)
            }}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-border/40"
          >
            {t('admin.catalogJoin')}
          </button>
        ) : null}
        {user && joining && joining.id !== race.id ? (
          <button
            type="button"
            onClick={() => void join(race)}
            className="rounded-md border border-primary px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            {t('admin.catalogJoinHere')}
          </button>
        ) : null}
        {race.duplicateOfCatalogRaceId && user ? (
          <button
            type="button"
            onClick={async () => {
              await unmergeCatalogRace(race.id, user.uid)
              setStale([])
              setNext(undefined)
              await load()
            }}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-border/40"
          >
            {t('admin.duplicatesUndo', { name: race.duplicateOfCatalogRaceId })}
          </button>
        ) : null}
      </li>
    )
  }

  return (
    <PageShell title={t('admin.catalogTitle')}>
      <p className="mt-2 text-sm text-muted">{t('admin.catalogSubtitle')}</p>
      <AdminTabs />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t('admin.catalogStaleCount', { count: stale.length })}</p>
        <Link
          to="/admin/catalogo/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t('admin.catalogNew')}
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {joined ? <p className="mt-4 text-sm text-primary">{joined}</p> : null}

      {picked.size > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t('admin.catalogPicked', { count: picked.size })}
          </p>
          <label className="sr-only" htmlFor="catalog-sweep-reason">
            {t('admin.catalogRetiredReason')}
          </label>
          <select
            id="catalog-sweep-reason"
            value={reason}
            onChange={(change) => setReason(change.target.value as RetiredReason | '')}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">{t('admin.catalogRetiredReason')}</option>
            {RETIRED_REASONS.map((value) => (
              <option key={value} value={value}>
                {t(`admin.retiredReason.${value}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!reason || sweeping}
            onClick={() => void sweep()}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t('admin.catalogRetirePicked')}
          </button>
          {/* Neither answer yet: the race has not published next season, which
              is most of this queue, so it is asked again later instead. */}
          <label className="sr-only" htmlFor="catalog-snooze-days">
            {t('admin.catalogSnoozePicked')}
          </label>
          <select
            id="catalog-snooze-days"
            value={snooze}
            onChange={(change) => setSnooze(Number(change.target.value) as SnoozeDays)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SNOOZE_DAYS.map((days) => (
              <option key={days} value={days}>
                {t(`admin.snoozeDays.${days}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={sweeping}
            onClick={() => void putOff()}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
          >
            {t('admin.catalogSnoozePicked')}
          </button>
          {/* The other answer to the same question, and the one that needs no
              reason: a race is a race. */}
          <button
            type="button"
            disabled={sweeping}
            onClick={() => void keep()}
            className="rounded-md border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {t('admin.catalogKeepPicked')}
          </button>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="ml-auto text-xs font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : null}

      {/* A decision made this fast has to be as fast to take back. */}
      {swept.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-sm text-foreground">
            {sweptKind === 'kept'
              ? t('admin.catalogKept', { count: swept.length })
              : sweptKind === 'snoozed'
                ? t('admin.catalogSnoozed', { count: swept.length })
                : t('admin.catalogSwept', { count: swept.length })}
          </p>
          <button
            type="button"
            disabled={sweeping}
            onClick={() => void undoSweep()}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {t('admin.catalogSweptUndo')}
          </button>
          <button
            type="button"
            onClick={() => setSwept([])}
            className="ml-auto text-xs font-semibold text-muted hover:text-foreground"
          >
            {t('common.dash')}
          </button>
        </div>
      ) : null}

      {joining ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">
            {t('admin.catalogJoinBanner', { name: joining.name })}
          </p>
          <button
            type="button"
            onClick={() => setJoining(null)}
            className="ml-auto text-xs font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : null}

      <CatalogProposals />

      {user ? <CatalogDuplicates adminUid={user.uid} onChanged={() => void load()} /> : null}

      {/* What the name says is not a running race. A list to answer, not a
          rule: a walk beside a run is a run, and only a person can tell. */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('admin.catalogOtherSportTitle')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('admin.catalogOtherSportHint')}</p>
        <button
          type="button"
          disabled={reading}
          onClick={() => void readOtherSports()}
          className="mt-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
        >
          {reading ? t('common.loading') : t('admin.catalogOtherSportFind')}
        </button>

        {otherSports === null ? null : otherSports.length === 0 ? (
          <p className="mt-3 text-xs text-muted">{t('admin.catalogOtherSportNone')}</p>
        ) : (
          <>
            <p className="mt-3 text-xs font-semibold text-foreground">
              {t('admin.catalogOtherSportFound', { count: otherSports.length })}
            </p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {otherSports.map(row)}
            </ul>
          </>
        )}
      </section>

      {/* The other flow. Not a filter over the queue: a question about the
          whole catalog, asked when one entry is wrong. */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('admin.catalogSearchTitle')}
        </h2>
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={(submit) => {
            submit.preventDefault()
            void search()
          }}
        >
          <label className="sr-only" htmlFor="admin-catalog-search">
            {t('admin.catalogSearchLabel')}
          </label>
          <input
            id="admin-catalog-search"
            value={term}
            onChange={(change) => setTerm(change.target.value)}
            placeholder={t('admin.catalogSearchLabel')}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
          >
            {t('admin.catalogSearchLabel')}
          </button>
        </form>

        {found === null ? null : found.length === 0 ? (
          <p className="mt-3 text-xs text-muted">{t('admin.catalogSearchEmpty')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {found.map(row)}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('admin.catalogGroup.stale', { count: waiting ?? stale.length })}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('admin.catalogStaleHint')}</p>

        {loading && stale.length === 0 ? (
          <div className="mt-2 space-y-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
            ))}
          </div>
        ) : stale.length === 0 ? (
          <div className="mt-2 rounded-lg border border-border bg-surface p-6">
            <p className="text-sm text-foreground">{t('admin.catalogNothingStale')}</p>
          </div>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
              {stale.map(row)}
            </ul>
            {next ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void load(next)}
                className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('findRaces.more')}
              </button>
            ) : null}
          </>
        )}
      </section>
    </PageShell>
  )
}
