#!/usr/bin/env npx tsx
/**
 * Fills in `trackPacingDriftSeconds` on events whose track predates the field.
 *
 * The drift is computed from the splits already stored on the track document, so
 * this reads nothing from Storage and re-parses no files.
 *
 * Scoped to one account. Pass --all-users to sweep every account on the
 * instance, which is a deliberate choice rather than the default: an admin
 * script reaching other people's documents should have to say so.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:track-pacing -- --confirm --user-id <uid>
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:track-pacing -- --dry-run --user-id <uid>
 *   npm run backfill:track-pacing -- --confirm --user-id <uid>
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
const allUsers = process.argv.includes('--all-users')
const userIdIndex = process.argv.indexOf('--user-id')
const userId = userIdIndex === -1 ? null : process.argv[userIdIndex + 1]

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

if (!userId && !allUsers) {
  console.error('Refusing to run. Pass --user-id <uid>, or --all-users to sweep the instance.')
  process.exit(1)
}

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

console.log(`Target project: ${PROJECT_ID}`)
console.log(`Target user: ${userId ?? 'every account on this instance'}`)
console.log(`Mode: ${dryRun ? 'dry run' : 'write'}`)

const query = userId
  ? db.collection('events').where('userId', '==', userId)
  : db.collection('events')
const events = await query.get()
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
