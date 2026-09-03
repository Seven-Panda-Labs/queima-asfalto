import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  catalogDuplicateCandidates,
  type DuplicateCandidate,
} from '../../../shared/eventDiscovery/duplicates'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { mergeCatalogRaces, separateCatalogRaces } from '../../services/adminRaceCatalog'

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

function Side({ race, label }: { race: RaceCatalogEntry; label?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-foreground">
        {race.name}
        {label ? (
          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {label}
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted">
        {[race.city, race.country, firstDate(race), race.id].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

export function CatalogDuplicates({
  races,
  adminUid,
  onChanged,
}: {
  races: RaceCatalogEntry[]
  adminUid: string
  onChanged: () => Promise<void> | void
}) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const candidates = useMemo(() => catalogDuplicateCandidates(races), [races])

  const act = async (candidate: DuplicateCandidate, merge: boolean) => {
    const key = `${candidate.keep.id}:${candidate.drop.id}`
    setPending(key)
    setError(null)
    try {
      if (merge) {
        await mergeCatalogRaces(candidate.keep.id, candidate.drop.id, adminUid)
      } else {
        await separateCatalogRaces(candidate.keep.id, candidate.drop.id, adminUid)
      }
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
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(candidate, true)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {t('admin.duplicatesMerge', { name: candidate.keep.name })}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(candidate, false)}
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
