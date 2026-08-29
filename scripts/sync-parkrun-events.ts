/**
 * Refresh the bundled parkrun catalog seed.
 *
 * In production the catalog is kept fresh by the `syncParkrunCatalog`
 * scheduled function, which writes to Firestore. This script maintains the
 * committed copy the app falls back to when that document is missing — a
 * fresh project, a self-hosted instance without functions, or a failed read.
 *
 * Usage: npx tsx scripts/sync-parkrun-events.ts
 * Output: src/data/parkrun-events.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  catalogSyncDate,
  isAcceptableRefresh,
  normalizeParkrunCatalog,
  PARKRUN_EVENTS_URL,
  type RawParkrunEventsJson,
} from '../shared/parkrun/catalogSource.js'

const OUTPUT = resolve(import.meta.dirname, '../src/data/parkrun-events.json')

const response = await fetch(PARKRUN_EVENTS_URL)
if (!response.ok) {
  throw new Error(`Failed to fetch parkrun events: ${response.status}`)
}

const raw = (await response.json()) as RawParkrunEventsJson
const catalog = normalizeParkrunCatalog(raw, catalogSyncDate(new Date()))

const decision = isAcceptableRefresh(catalog.events.length, null)
if (!decision.accepted) {
  throw new Error(`Refusing to write catalog: ${decision.reason}`)
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify(catalog)}\n`, 'utf8')
console.log(`Wrote ${catalog.events.length} events to ${OUTPUT}`)
