import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DuplicateCandidate } from '../../../shared/eventDiscovery/duplicates'
import type { DuplicateVoteTally, RaceCatalogEntry } from '../../../shared/raceCatalog'
import { duplicateVotePairId } from '../../../shared/raceCatalog'
import {
  loadDuplicateQueue,
  mergeCatalogRaces,
  separateCatalogRaces,
} from '../../services/adminRaceCatalog'
import { loadDuplicateVoteTallies } from '../../services/duplicateVotes'

/**
 * The pairs the harvest refuses to decide.
 *
 * Two sources can produce the same race under two organiser names that agree on
 * nothing, and with nobody having checked either entry there is no evidence to
 * merge on. So it gets asked rather than guessed, and both answers are recorded:
 * "different races" has to stick, or the next harvest asks again.
 */
function firstDate(race: RaceCatalogEntry): string | null {
  const dated = (race.editions ?? []).map((edition) => edition.raceDate).filter(Boolean)
  return dated.sort()[0] ?? null
}

/**
 * The source, named the way an operator would go and check.
 *
 * A curated entry records how it was checked as well as where ("nyrr.org,
 * supplied in review 2026-09-01"), and only the host is worth a line here.
 */
function host(source: string): string {
  return source.split(',')[0]?.trim() ?? source
}

function Side({ race, label }: { race: RaceCatalogEntry; label?: string }) {
  const { t } = useTranslation()

  return (
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold text-foreground">{race.name}</span>
        {/* The two names are what the operator is deciding between, and the
            source page is the only place the answer actually lives. */}
        {race.officialUrl ? (
          <a
            href={race.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={race.officialUrl}
            aria-label={t('admin.duplicatesOpenSource', { source: host(race.source) })}
            className="shrink-0 rounded px-1 text-primary hover:bg-primary/10"
          >
            🔗
          </a>
        ) : null}
        {label ? (
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {label}
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted">
        {[race.city, race.country, firstDate(race), host(race.source), race.id]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </div>
  )
}

export function CatalogDuplicates({
  adminUid,
  onChanged,
}: {
  adminUid: string
  onChanged: () => Promise<void> | void
}) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tallies, setTallies] = useState<Map<string, DuplicateVoteTally>>(new Map())
  const [pairs, setPairs] = useState<[RaceCatalogEntry, RaceCatalogEntry][]>([])

  useEffect(() => {
    void loadDuplicateVoteTallies().then(setTallies)
  }, [])

  // The pairs come from the daily job rather than from the whole catalog: the
  // rule compares every pair against every other, and working that out here
  // meant downloading five thousand entries to find a dozen.
  const reload = useCallback(() => {
    void loadDuplicateQueue().then(setPairs)
  }, [])

  useEffect(reload, [reload])

  /**
   * The pairs, the ones runners recognised first.
   *
   * A vote decides nothing here, it only says which question somebody already
   * knows the answer to, so those stop hiding behind the rest of the queue.
   */
  const candidates = useMemo(() => {
    const votes = (candidate: DuplicateCandidate) =>
      tallies.get(duplicateVotePairId(candidate.keep.id, candidate.drop.id))
    const count = (candidate: DuplicateCandidate) => {
      const tally = votes(candidate)
      return (tally?.same ?? 0) + (tally?.different ?? 0)
    }
    return pairs
      .map(([keep, drop]) => ({ keep, drop }))
      .sort((left, right) => count(right) - count(left))
  }, [pairs, tallies])

  /**
   * @param survivor which entry the pair collapses into, or none to keep both.
   *
   * The suggestion is a guess made from what each entry carries, and an
   * operator can prefer the other name for reasons no rule has: the organiser
   * calls it that, or the sponsor in the other name is last year's.
   */
  const act = async (candidate: DuplicateCandidate, survivor: RaceCatalogEntry | null) => {
    const key = `${candidate.keep.id}:${candidate.drop.id}`
    setPending(key)
    setError(null)
    try {
      if (survivor) {
        const dropped = survivor.id === candidate.keep.id ? candidate.drop : candidate.keep
        await mergeCatalogRaces(survivor.id, dropped.id, adminUid)
      } else {
        await separateCatalogRaces(candidate.keep.id, candidate.drop.id, adminUid)
      }
      reload()
      await onChanged()
    } catch {
      setError(t('admin.duplicatesError'))
    } finally {
      setPending(null)
    }
  }

  if (candidates.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('admin.duplicatesTitle', { count: candidates.length })}
      </h2>
      <p className="mt-1 text-xs text-muted">{t('admin.duplicatesHint')}</p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
        {candidates.map((candidate) => {
          const key = `${candidate.keep.id}:${candidate.drop.id}`
          const busy = pending === key
          return (
            <li key={key} className="px-4 py-3">
              <div className="flex flex-wrap items-start gap-3">
                <Side race={candidate.keep} label={t('admin.duplicatesKeep')} />
                <Side race={candidate.drop} />
              </div>
              {(() => {
                const tally = tallies.get(duplicateVotePairId(candidate.keep.id, candidate.drop.id))
                if (!tally) return null
                return (
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {t('admin.duplicatesVotes', {
                      same: tally.same,
                      different: tally.different,
                    })}
                  </p>
                )
              })()}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(candidate, candidate.keep)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {t('admin.duplicatesMerge', { name: candidate.keep.name })}
                </button>
                {/* The same answer the other way round, for when the operator
                    prefers the name the suggestion did not pick. */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(candidate, candidate.drop)}
                  className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {t('admin.duplicatesMergeOther', { name: candidate.drop.name })}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(candidate, null)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
                >
                  {t('admin.duplicatesSeparate')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
