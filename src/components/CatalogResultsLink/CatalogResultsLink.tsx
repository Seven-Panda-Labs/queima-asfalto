import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { detectPlatform } from '../../../shared/officialResults'
import { loadCatalogRace } from '../../services/raceCatalog'
import { getRace } from '../../services/races'
import { updateEvent } from '../../services/events'
import type { Event } from '../../types/Event'

/**
 * Offers the results page the catalog holds for the year this event was run.
 *
 * The link runners contribute is worth nothing while only they can see it.
 * This is the other half: a runner with no results link gets the one somebody
 * who ran the same edition already found, and the automatic lookup, which is
 * unlocked by having a link at all, becomes possible without hunting for the
 * timing company's page.
 *
 * Per edition, because that is how the catalog holds it: the 2024 results page
 * is not the 2026 one, and offering the wrong year would be worse than
 * offering nothing.
 *
 * Nothing is applied on its own. The runner's own link, if they have one, is
 * never touched, and the offer only appears when there is none.
 */
export function CatalogResultsLink({
  event,
  onUsed,
}: {
  event: Event
  /** Called after the link is written, for the page to read the event again. */
  onUsed: () => void
}) {
  const { t } = useTranslation()
  const [offer, setOffer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wanted = !event.resultsUrl && Boolean(event.raceId)
  const year = event.date.getFullYear()

  useEffect(() => {
    if (!wanted) return

    let cancelled = false
    void (async () => {
      // Two reads to walk the chain from an event to the shared entry, and
      // only on an event that has no link of its own.
      const race = await safely(() => getRace(event.raceId!))
      if (!race?.catalogRaceId || cancelled) return
      const entry = await safely(() => loadCatalogRace(race.catalogRaceId!))
      if (cancelled) return
      const edition = entry?.editions?.find((candidate) => candidate.year === year)
      if (edition?.resultsUrl) setOffer(edition.resultsUrl)
    })()

    return () => {
      cancelled = true
    }
  }, [event.raceId, wanted, year])

  if (!wanted || !offer) return null

  const use = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateEvent(event.id, {
        resultsUrl: offer,
        resultsPlatform: detectPlatform(offer, event.name) ?? undefined,
      })
      onUsed()
    } catch {
      setError(t('catalogResults.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-3 rounded-md border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted">{t('catalogResults.offer', { year })}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <a
          href={offer}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 truncate text-xs font-semibold text-primary hover:underline"
        >
          {hostOf(offer)}
        </a>
        <button
          type="button"
          disabled={saving}
          onClick={() => void use()}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {t('catalogResults.use')}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  )
}

/** What the link is, in one word, since the URL itself is unreadable. */
function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Never in the way.
 *
 * An instance with no catalog, or a read the rules deny, has to leave the
 * editor exactly as it was before this existed.
 */
async function safely<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action()
  } catch {
    return null
  }
}
