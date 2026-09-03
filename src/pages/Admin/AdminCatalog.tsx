import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { needsEditionReview, type RaceCatalogEntry } from '../../../shared/raceCatalog'
import { useAuth } from '../../contexts/AuthContext'
import { listCatalogForAdmin, unmergeCatalogRace } from '../../services/adminRaceCatalog'
import { AdminTabs } from './AdminTabs'
import { CatalogDuplicates } from './CatalogDuplicates'

type Group = {
  key: 'unreviewed' | 'stale' | 'current' | 'retired' | 'copies'
  races: RaceCatalogEntry[]
}

/**
 * The three queues from `catalog:review`, plus what has been retired.
 *
 * Order is the point of the screen: never checked first, then checked but out of
 * dates, then what needs nothing. An operator opening this should see work, not a
 * catalog.
 */
function groupForReview(races: RaceCatalogEntry[], today: Date): Group[] {
  // An entry pointed at another one is not work: it is a decision already made,
  // and it gets its own group at the end so it stays visible and undoable.
  const live = races.filter(
    (race) => race.retired !== true && !race.duplicateOfCatalogRaceId,
  )
  const monthsAway = (race: RaceCatalogEntry) =>
    ((race.typicalRaceMonth ?? 13) - (today.getUTCMonth() + 1) + 12) % 12
  const byMonth = (left: RaceCatalogEntry, right: RaceCatalogEntry) =>
    monthsAway(left) - monthsAway(right)

  const needs = live.filter((race) => needsEditionReview(race, today))

  return [
    {
      key: 'unreviewed',
      races: needs.filter((race) => race.review === 'unreviewed').sort(byMonth),
    },
    {
      key: 'stale',
      races: needs.filter((race) => race.review === 'reviewed').sort(byMonth),
    },
    {
      key: 'current',
      races: live.filter((race) => !needsEditionReview(race, today)).sort(byMonth),
    },
    { key: 'retired', races: races.filter((race) => race.retired === true).sort(byMonth) },
    {
      key: 'copies',
      races: races.filter((race) => Boolean(race.duplicateOfCatalogRaceId)).sort(byMonth),
    },
  ]
}

function nextEdition(race: RaceCatalogEntry): string | null {
  const dated = (race.editions ?? []).filter((edition) => edition.raceDate)
  const sorted = [...dated].sort((left, right) => (left.raceDate! < right.raceDate! ? 1 : -1))
  return sorted[0]?.raceDate ?? null
}

export function AdminCatalog() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [races, setRaces] = useState<RaceCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRaces(await listCatalogForAdmin())
    } catch {
      setError(t('admin.catalogLoadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo(() => groupForReview(races, new Date()), [races])

  return (
    <PageShell title={t('admin.catalogTitle')}>
      <p className="mt-2 text-sm text-muted">{t('admin.catalogSubtitle')}</p>
      <AdminTabs />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t('admin.catalogCount', { count: races.length })}</p>
        <Link
          to="/admin/catalogo/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t('admin.catalogNew')}
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {user ? (
        <CatalogDuplicates races={races} adminUid={user.uid} onChanged={load} />
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
          ))}
        </div>
      ) : races.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-foreground">{t('admin.catalogEmpty')}</p>
          <p className="mt-2 text-xs text-muted">{t('admin.catalogEmptyHint')}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) =>
            group.races.length === 0 ? null : (
              <section key={group.key}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t(`admin.catalogGroup.${group.key}`, { count: group.races.length })}
                </h2>
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
                  {group.races.map((race) => (
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
                      <span className="text-xs text-muted">
                        {t(`admin.entryMethod.${race.entryMethod}`)}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-muted">
                        {nextEdition(race) ?? t('admin.catalogNoEdition')}
                      </span>
                      {race.duplicateOfCatalogRaceId && user ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await unmergeCatalogRace(race.id, user.uid)
                            await load()
                          }}
                          className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-border/40"
                        >
                          {t('admin.duplicatesUndo', {
                            name: race.duplicateOfCatalogRaceId,
                          })}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </PageShell>
  )
}
