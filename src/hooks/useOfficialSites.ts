import { useEffect, useMemo, useState } from 'react'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { ParkrunCatalog } from '../../shared/parkrun/catalog'
import { officialSite } from '../domain/officialSite'
import { parkrunSite, parkrunSiteNeedsCatalog } from '../domain/parkrunEvent'
import { findParkrunEvent, loadParkrunCatalog } from '../services/parkrunCatalog'
import { loadCatalogRacesFollowingCopies } from '../services/raceCatalog'
import type { Event } from '../types/Event'
import type { Race } from '../types/Race'

/**
 * The official site of each of these races, by race id.
 *
 * Reads the catalog behind them, one query per ten races, because a race
 * linked to the catalog after it was created never copied the organiser's
 * link, one found on a calendar copied the calendar, and one whose entry was
 * merged into another points at the copy the site moved away from.
 */
export function useOfficialSites(
  raceIds: readonly (string | undefined)[],
  races: readonly Race[],
): Map<string, string> {
  const wanted = useMemo(() => {
    const ids = new Set(raceIds.filter((id): id is string => Boolean(id)))
    return races.filter((race) => ids.has(race.id))
  }, [raceIds, races])

  // A string, so a new array with the same ids does not read the catalog again.
  const catalogKey = [...new Set(wanted.map((race) => race.catalogRaceId).filter(Boolean))]
    .sort()
    .join(',')
  const [loaded, setLoaded] = useState<{ key: string; entries: Map<string, RaceCatalogEntry> }>(
    { key: '', entries: new Map() },
  )

  useEffect(() => {
    if (!catalogKey) return
    let cancelled = false
    void loadCatalogRacesFollowingCopies(catalogKey.split(',')).then((entries) => {
      if (!cancelled) setLoaded({ key: catalogKey, entries })
    })
    return () => {
      cancelled = true
    }
  }, [catalogKey])

  // Nothing until the catalog has answered: it may know a different site than
  // the race's copy, and a link that changes under the pointer is worse than a wait.
  const ready = !catalogKey || loaded.key === catalogKey
  const entries = loaded.entries

  return useMemo(() => {
    const sites = new Map<string, string>()
    if (!ready) return sites
    for (const race of wanted) {
      const entry = race.catalogRaceId ? entries.get(race.catalogRaceId) : undefined
      const site = officialSite(race, entry)
      if (site) sites.set(race.id, site)
    }
    return sites
  }, [ready, wanted, entries])
}

/**
 * The official site of each of these events, by event id.
 *
 * A parkrun's page comes from the event itself, so it shows in a shared view
 * too. Anything else goes through the race, which only our own races allow.
 * The parkrun catalog is a large read and is only made for a parkrun saved
 * without its country.
 */
export function useEventSites(
  events: readonly Event[],
  races: readonly Race[],
  { readRaces }: { readRaces: boolean },
): Map<string, string> {
  const raceIds = useMemo(
    () => (readRaces ? events.map((event) => event.raceId) : []),
    [events, readRaces],
  )
  const raceSites = useOfficialSites(raceIds, races)

  const needsParkrunCatalog = events.some(parkrunSiteNeedsCatalog)
  const [parkrunCatalog, setParkrunCatalog] = useState<ParkrunCatalog | null>(null)
  useEffect(() => {
    if (!needsParkrunCatalog || parkrunCatalog) return
    let cancelled = false
    loadParkrunCatalog()
      .then((catalog) => {
        if (!cancelled) setParkrunCatalog(catalog)
      })
      .catch(() => {
        // No catalog, no link: the rest of the page does not depend on it.
      })
    return () => {
      cancelled = true
    }
  }, [needsParkrunCatalog, parkrunCatalog])

  return useMemo(() => {
    const countryUrlOf = parkrunCatalog
      ? (slug: string) => findParkrunEvent(parkrunCatalog, slug)?.countryUrl
      : undefined
    const sites = new Map<string, string>()
    for (const event of events) {
      const site =
        parkrunSite(event, countryUrlOf) ?? (event.raceId ? raceSites.get(event.raceId) : undefined)
      if (site) sites.set(event.id, site)
    }
    return sites
  }, [events, raceSites, parkrunCatalog])
}
