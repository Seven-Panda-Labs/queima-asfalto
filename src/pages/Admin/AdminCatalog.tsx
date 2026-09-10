import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { useAuth } from '../../contexts/AuthContext'
import {
  listStaleForAdmin,
  searchCatalogForAdmin,
  unmergeCatalogRace,
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
  const [cursors, setCursors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [term, setTerm] = useState('')
  const [found, setFound] = useState<RaceCatalogEntry[] | null>(null)
  const [searching, setSearching] = useState(false)

  const load = useCallback(
    async (after?: string) => {
      setLoading(true)
      setError(null)
      try {
        const page = await listStaleForAdmin(PAGE_SIZE, after)
        setStale((current) => (after ? [...current, ...page.races] : page.races))
        setCursors((current) =>
          page.nextCursor ? [...current, page.nextCursor] : current,
        )
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

  const more = cursors[cursors.length - 1]

  /** One row, shared by the queue and the search: the same entry, two ways in. */
  const row = (race: RaceCatalogEntry) => (
    <li key={race.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Link
        to={`/admin/catalogo/${race.id}`}
        className="font-semibold text-foreground hover:text-primary"
      >
        {race.name}
      </Link>
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
      {race.duplicateOfCatalogRaceId && user ? (
        <button
          type="button"
          onClick={async () => {
            await unmergeCatalogRace(race.id, user.uid)
            setStale([])
            setCursors([])
            await load()
          }}
          className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-border/40"
        >
          {t('admin.duplicatesUndo', { name: race.duplicateOfCatalogRaceId })}
        </button>
      ) : null}
    </li>
  )

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

      <CatalogProposals />

      {user ? <CatalogDuplicates adminUid={user.uid} onChanged={() => void load()} /> : null}

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
          {t('admin.catalogGroup.stale', { count: stale.length })}
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
            {more ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void load(more)}
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
