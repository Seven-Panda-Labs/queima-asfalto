import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DuplicateCandidate } from '../../../shared/eventDiscovery/duplicates'
import { organiserPage } from '../../../shared/eventDiscovery/duplicates'
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

/**
 * One entry of the pair, with the button that keeps it.
 *
 * The button sits with the entry it keeps because the two names are often the
 * same, and two buttons that both said "keep Chicago Marathon" left the
 * operator guessing which one was which.
 */
function Side({
  race,
  suggested,
  busy,
  onKeep,
}: {
  race: RaceCatalogEntry
  suggested: boolean
  busy: boolean
  onKeep: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={race.name}
      className={`flex min-w-0 flex-col rounded-md border p-3 ${suggested ? 'border-primary/50' : 'border-border'}`}
    >
      <p className="flex items-start gap-2">
        <span className="min-w-0 flex-1 break-words font-semibold text-foreground">
          {race.name}
        </span>
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
        {suggested ? (
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {t('admin.duplicatesKeep')}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-muted">
        {[race.city, race.country, firstDate(race)].filter(Boolean).join(' · ')}
      </p>
      <p className="break-words text-xs text-muted">
        {[host(race.source), race.id].filter(Boolean).join(' · ')}
      </p>
      <div className="mt-auto pt-3">
        <button
          type="button"
          disabled={busy}
          onClick={onKeep}
          className={`w-full rounded-md border border-primary px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
            suggested
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'text-primary hover:bg-primary/10'
          }`}
        >
          {t('admin.duplicatesMerge')}
        </button>
      </div>
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
            <li key={key} className="px-3 py-3 sm:px-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Side
                  race={candidate.keep}
                  suggested
                  busy={busy}
                  onKeep={() => void act(candidate, candidate.keep)}
                />
                <Side
                  race={candidate.drop}
                  suggested={false}
                  busy={busy}
                  onKeep={() => void act(candidate, candidate.drop)}
                />
              </div>
              {(() => {
                // Why this pair is here at all, when the towns say two races:
                // the organiser published one page for both.
                const site = organiserPage(candidate.keep)
                if (!site || site !== organiserPage(candidate.drop)) return null
                return (
                  <p className="mt-2 break-words text-xs text-muted">
                    {t('admin.duplicatesSameOrganiser', { site })}
                  </p>
                )
              })()}
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
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(candidate, null)}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-border/40 disabled:opacity-50 sm:w-auto"
              >
                {t('admin.duplicatesSeparate')}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
