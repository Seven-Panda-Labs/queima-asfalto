/**
 * Download and normalize the global parkrun events catalog.
 *
 * Usage: npx tsx scripts/sync-parkrun-events.ts
 * Output: src/data/parkrun-events.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { resolve } from 'node:path'
import {
  countryUrlFromParkrunHost,
  type ParkrunCatalog,
  type ParkrunCatalogEvent,
} from '../shared/parkrun/catalog.js'

type RawEventsJson = {
  countries: Record<string, { url?: string } | null>
  events: {
    features: Array<{
      id: number
      properties: {
        eventname: string
        EventLongName: string
        EventShortName: string
        countrycode: number
        seriesid: number
        EventLocation: string
      }
      geometry: { coordinates: [number, number] }
    }>
  }
}

const OUTPUT = resolve(import.meta.dirname, '../src/data/parkrun-events.json')

const response = await fetch('https://images.parkrun.com/events.json')
if (!response.ok) {
  throw new Error(`Failed to fetch parkrun events: ${response.status}`)
}

const raw = (await response.json()) as RawEventsJson
const countryHosts = new Map<number, string>()

for (const [code, country] of Object.entries(raw.countries)) {
  if (!country?.url) continue
  countryHosts.set(Number(code), country.url)
}

const events: ParkrunCatalogEvent[] = raw.events.features
  .map((feature) => {
    const props = feature.properties
    const host = countryHosts.get(props.countrycode)
    if (!host) return null

    return {
      id: feature.id,
      slug: props.eventname,
      shortName: props.EventShortName,
      longName: props.EventLongName,
      location: props.EventLocation,
      countryCode: props.countrycode,
      countryUrl: countryUrlFromParkrunHost(host),
      seriesId: props.seriesid,
      lng: feature.geometry.coordinates[0]!,
      lat: feature.geometry.coordinates[1]!,
    }
  })
  .filter((event): event is ParkrunCatalogEvent => event != null)
  .sort((left, right) => left.longName.localeCompare(right.longName, 'en'))

const catalog: ParkrunCatalog = {
  syncedAt: new Date().toISOString().slice(0, 10),
  events,
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify(catalog)}\n`, 'utf8')
console.log(`Wrote ${events.length} events to ${OUTPUT}`)
