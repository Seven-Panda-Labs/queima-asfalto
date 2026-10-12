import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarPlusIcon, ExternalLinkIcon, HeartIcon } from '../icons/actionIcons'
import type { ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import {
  nearbyParkruns,
  NEARBY_KM,
  nextParkrunDate,
  referencePoints,
  type GeoPoint,
} from '../../domain/parkrunDiscovery'
import { parkrunSite } from '../../domain/parkrunEvent'
import { loadParkrunCatalog } from '../../services/parkrunCatalog'
import { formatDatePt } from '../../utils/date'

type NearbyParkrunsProps = {
  /** Their usual parkrun, which "near" is measured from by default. */
  homeSlug: string | undefined
  /** Shares the page's "where" box, so a search needs no permission. */
  place: string
  /** The page's circle, when it has a radius and somewhere to draw it from. */
  circle: { centre: GeoPoint; radiusKm: number } | null
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
  homeSlug,
  place,
  circle,
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

  // The page's circle first, then the usual parkrun, then the browser.
  const references = useMemo(() => {
    if (circle) return [circle.centre]
    if (!catalog) return []
    const home = homeSlug ? referencePoints(catalog, [homeSlug]) : []
    return home.length > 0 ? home : located ? [located] : []
  }, [catalog, circle, homeSlug, located])

  const candidates = useMemo(
    () =>
      catalog
        ? nearbyParkruns(catalog, references, {
            place: circle ? undefined : place,
            radiusKm: circle?.radiusKm,
          })
        : [],
    [catalog, circle, place, references],
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
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">{event.longName}</span>
                <span className="block text-xs text-muted">
                  {/* The usual parkrun is where "near" is measured from, 0 km away. */}
                  {references.length > 0 && distanceKm >= 0.05
                    ? `${event.location} · ${t('parkrunDiscovery.away', { km: distanceKm.toFixed(1) })}`
                    : event.location}
                </span>
              </div>
              <span className="w-24 shrink-0 text-end text-xs tabular-nums text-muted">
                {formatDatePt(saturday)}
              </span>

              {/* The same actions as every other race in this page, drawn the
                  same way: a parkrun is not a different kind of row. */}
              <div className="flex shrink-0 flex-nowrap items-center gap-1">
                <a
                  href={parkrunSite({ parkrunEventSlug: event.slug, parkrunCountryUrl: event.countryUrl })}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('common.officialSite')}
                  aria-label={t('common.officialSite')}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
                >
                  <ExternalLinkIcon />
                </a>
                <button
                  type="button"
                  onClick={() => void run(event.slug, () => onPlan(event, saturday))}
                  disabled={busySlug === event.slug}
                  title={t('parkrunDiscovery.plan')}
                  aria-label={t('parkrunDiscovery.plan')}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
                >
                  <CalendarPlusIcon />
                </button>
                <button
                  type="button"
                  onClick={() => void run(event.slug, () => onWatch(event))}
                  disabled={busySlug === event.slug || addedSlugs.includes(event.slug)}
                  title={addedSlugs.includes(event.slug) ? t('findRaces.added') : t('parkrunDiscovery.watch')}
                  aria-label={
                    addedSlugs.includes(event.slug)
                      ? t('findRaces.added')
                      : t('parkrunDiscovery.watch')
                  }
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
                >
                  <HeartIcon filled={addedSlugs.includes(event.slug)} />
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
