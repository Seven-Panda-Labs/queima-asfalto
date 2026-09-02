import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import {
  nearbyParkruns,
  NEARBY_KM,
  nextParkrunDate,
  referencePoints,
  type GeoPoint,
} from '../../domain/parkrunDiscovery'
import { loadParkrunCatalog } from '../../services/parkrunCatalog'
import { formatDatePt } from '../../utils/date'

type NearbyParkrunsProps = {
  /** The runner's own parkruns: starred, and the ones they have run. */
  knownSlugs: readonly string[]
  /** Shares the page's "where" box, so a search needs no permission. */
  place: string
  onPlan: (event: ParkrunCatalogEvent, date: Date) => Promise<void>
  onWatch: (event: ParkrunCatalogEvent) => Promise<void>
  addedSlugs: readonly string[]
}

/**
 * The races no calendar lists.
 *
 * A parkrun is free, weekly and the same 5 km in a couple of thousand places,
 * so it never appears in a race listing and the question about it is never
 * "what is on in October". It is "which one is near me", and the answer is
 * measured from the runner's own parkruns before anybody is asked for a
 * location.
 */
export function NearbyParkruns({
  knownSlugs,
  place,
  onPlan,
  onWatch,
  addedSlugs,
}: NearbyParkrunsProps) {
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState<ParkrunCatalogEvent[] | null>(null)
  const [located, setLocated] = useState<GeoPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [busySlug, setBusySlug] = useState<string | null>(null)

  useEffect(() => {
    void loadParkrunCatalog().then((loaded) => setCatalog(loaded.events))
  }, [])

  const references = useMemo(() => {
    if (!catalog) return []
    const own = referencePoints(catalog, knownSlugs)
    return own.length > 0 ? own : located ? [located] : []
  }, [catalog, knownSlugs, located])

  const candidates = useMemo(
    () => (catalog ? nearbyParkruns(catalog, references, { place }) : []),
    [catalog, place, references],
  )

  const saturday = nextParkrunDate()

  function askForLocation() {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }
    setLocating(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocated({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocating(false)
      },
      () => {
        // Refusing is an answer, and the place box still works.
        setLocationError(true)
        setLocating(false)
      },
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  async function run(slug: string, action: () => Promise<void>) {
    setBusySlug(slug)
    try {
      await action()
    } finally {
      setBusySlug(null)
    }
  }

  if (catalog === null) return null

  const needsLocation = references.length === 0 && !place

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-lg tracking-wide text-foreground">
          {t('parkrunDiscovery.title')}
        </h2>
        {needsLocation || locationError ? (
          <button
            type="button"
            onClick={askForLocation}
            disabled={locating}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {locating ? t('common.loading') : t('parkrunDiscovery.useLocation')}
          </button>
        ) : null}
      </div>

      {needsLocation ? (
        <p className="mt-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {locationError
            ? t('parkrunDiscovery.locationRefused')
            : t('parkrunDiscovery.noReference')}
        </p>
      ) : candidates.length === 0 ? (
        <p className="mt-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {t('parkrunDiscovery.noneNearby')}
        </p>
      ) : (
        <>
          {/* parkrun does not operate everywhere: from Lisbon the nearest is in
              Gibraltar. Saying so beats an empty list that never explains. */}
          {references.length > 0 && !place && candidates[0]!.distanceKm > NEARBY_KM ? (
            <p className="mt-2 text-xs text-muted">
              {t('parkrunDiscovery.farAway', { km: Math.round(candidates[0]!.distanceKm) })}
            </p>
          ) : null}
          <ul className="mt-2 rounded-xl border border-border bg-surface">
          {candidates.map(({ event, distanceKm }) => (
            <li
              key={event.slug}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="font-semibold text-foreground">{event.longName}</span>
              <span className="text-xs text-muted">{event.location}</span>
              {references.length > 0 ? (
                <span className="text-xs text-muted">
                  {t('parkrunDiscovery.away', { km: distanceKm.toFixed(1) })}
                </span>
              ) : null}
              <span className="text-xs text-muted">
                {t('parkrunDiscovery.saturday', { date: formatDatePt(saturday) })}
              </span>

              <div className="ms-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void run(event.slug, () => onPlan(event, saturday))}
                  disabled={busySlug === event.slug}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {t('parkrunDiscovery.plan')}
                </button>
                <button
                  type="button"
                  onClick={() => void run(event.slug, () => onWatch(event))}
                  disabled={busySlug === event.slug || addedSlugs.includes(event.slug)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {addedSlugs.includes(event.slug)
                    ? t('findRaces.added')
                    : t('parkrunDiscovery.watch')}
                </button>
              </div>
            </li>
          ))}
          </ul>
        </>
      )}
    </section>
  )
}
