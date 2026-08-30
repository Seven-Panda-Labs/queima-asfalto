#!/usr/bin/env npx tsx
/**
 * Fills in `trackPacingDriftSeconds` on events whose track predates the field.
 *
 * The drift is computed from the splits already stored on the track document, so
 * this reads nothing from Storage and re-parses no files.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:track-pacing -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:track-pacing -- --dry-run
 *   npm run backfill:track-pacing -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { computePacingDrift } from '../src/domain/activityTrack/pacing.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

console.log(`Target project: ${PROJECT_ID}`)
console.log(`Mode: ${dryRun ? 'dry run' : 'write'}`)

const events = await db.collection('events').get()
let examined = 0
let written = 0
let alreadySet = 0
let noTrack = 0
let tooShort = 0

for (const event of events.docs) {
  examined += 1
  if (typeof event.data().trackPacingDriftSeconds === 'number') {
    alreadySet += 1
    continue
  }

  const track = await event.ref.collection('track').doc('current').get()
  if (!track.exists) {
    noTrack += 1
    continue
  }

  const splits = (track.data()?.splits ?? []) as Array<{
    paceSecondsPerKm: number
    partial: boolean
  }>
  const drift = computePacingDrift(splits)
  if (drift === null) {
    tooShort += 1
    continue
  }

  if (dryRun) {
    console.log(`  would set ${event.id} -> ${drift >= 0 ? '+' : ''}${drift} s/km`)
  } else {
    await event.ref.update({ trackPacingDriftSeconds: drift })
  }
  written += 1
}

console.log(
  `\nevents examined: ${examined}\n` +
    `  ${dryRun ? 'would write' : 'written'}: ${written}\n` +
    `  already set:  ${alreadySet}\n` +
    `  no track:     ${noTrack}\n` +
    `  too short:    ${tooShort}`,
)
