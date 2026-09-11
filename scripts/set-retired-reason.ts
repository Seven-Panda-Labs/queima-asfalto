#!/usr/bin/env npx tsx
/**
 * Says why an entry that is already out of the catalog is out.
 *
 * The switch came before the reason, so the entries retired until now say
 * nothing about why, and the reason is what decides whether a new edition is
 * news or the source repeating itself.
 *
 * It guesses nothing. A name is not evidence: of 281 live entries whose name
 * reads as another sport or a walk, many are a run with a walk beside it. So
 * this lists what has no reason and writes only what is passed to it.
 *
 *   npm run set:retired-reason -- --dry-run
 *   npm run set:retired-reason -- --confirm --set de-berlin-x=over --set at-y=other_sport
 *
 * Against the emulator, prefix with
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { RETIRED_REASONS, type RetiredReason } from '../shared/raceCatalog/types.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

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

/** `--set <id>=<reason>`, as many as there are entries to answer for. */
function assignments(): Map<string, RetiredReason> {
  const wanted = new Map<string, RetiredReason>()
  for (let at = 0; at < process.argv.length; at += 1) {
    if (process.argv[at] !== '--set') continue
    const [id, reason] = (process.argv[at + 1] ?? '').split('=')
    if (!id || !reason) {
      console.error(`Expected --set <id>=<reason>, got "${process.argv[at + 1]}"`)
      process.exit(1)
    }
    if (!RETIRED_REASONS.includes(reason as RetiredReason)) {
      console.error(`"${reason}" is not one of ${RETIRED_REASONS.join(', ')}`)
      process.exit(1)
    }
    wanted.set(id, reason as RetiredReason)
  }
  return wanted
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const wanted = assignments()

  const snapshot = await db.collection('raceCatalog').get()
  const retired = snapshot.docs
    .map((document: { id: string; data: () => unknown }) => ({
      ...(document.data() as RaceCatalogEntry),
      id: document.id,
    }))
    .filter((entry: RaceCatalogEntry) => entry.retired === true)

  const unanswered = retired.filter((entry: RaceCatalogEntry) => !entry.retiredReason)
  console.log(`${retired.length} entries are out of the catalog, ${unanswered.length} say no reason`)
  for (const entry of unanswered) {
    const answer = wanted.get(entry.id)
    const editions = (entry.editions ?? []).map((edition: { year: number }) => edition.year).join(', ')
    console.log(
      `  ${entry.id}\n     "${entry.name}" ${entry.city}, ${entry.country} | ${entry.source}` +
        ` | editions ${editions || 'none'}\n     -> ${answer ?? 'nothing passed for this one'}`,
    )
  }

  const writes = [...wanted].filter(([id]) => snapshot.docs.some((document: { id: string }) => document.id === id))
  const missing = [...wanted].filter(([id]) => !writes.some(([known]) => known === id))
  for (const [id] of missing) console.log(`  no entry called ${id}, skipped`)

  if (dryRun || writes.length === 0) {
    console.log(dryRun ? 'Dry run, nothing written.' : 'Nothing to write.')
    return
  }

  for (const [id, reason] of writes) {
    await db.collection('raceCatalog').doc(id).update({ retired: true, retiredReason: reason })
  }
  console.log(`written ${writes.length}`)
}

await main()
