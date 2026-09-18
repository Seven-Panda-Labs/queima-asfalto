#!/usr/bin/env npx tsx
/**
 * Replaces the listing's page with the organiser's own site.
 *
 * An entry keeps the page it was read from as its official URL, because that
 * is all the harvest knew. For nine tenths of this catalog that page belongs
 * to runme.de or running.life, which costs an operator a second click every
 * time and hides the strongest duplicate signal there is: two entries for one
 * race, found on two calendars, point at the same organiser.
 *
 * Both platforms mark the link, so this reads a marked anchor and never prose.
 * What it writes is `officialUrl` for the organiser and `sourceUrl` for the
 * page it came from, so nothing is lost and provenance stays exact.
 *
 * A page with no organiser link is left as it is, and is tried again another
 * day: an entry still unresolved is one whose two URLs are the same.
 *
 *   npm run resolve:organiser-links -- --dry-run --limit 20
 *   npm run resolve:organiser-links -- --confirm --limit 500
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { readOrganiserLink } from '../shared/eventDiscovery/organiserLink.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')
const limitAt = process.argv.indexOf('--limit')
const limit = limitAt > -1 ? Number(process.argv[limitAt + 1]) : Number.POSITIVE_INFINITY

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

/** Identified and slow, the same as the harvest that reads these sites. */
const USER_AGENT =
  'queima-asfalto-discovery/1.0 (+https://github.com/Seven-Panda-Labs/queima-asfalto)'
const DELAY_MS = 800

/** The listings whose pages carry a link to the race's own site. */
const PLATFORM = /(?:^|\.)(?:runme\.(?:de|at|ch|us)|running\.life)$/i

function isPlatform(url: string | undefined): boolean {
  if (!url) return false
  try {
    return PLATFORM.test(new URL(url).host.replace(/^www\./, ''))
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('raceCatalog').get()
  const pending = snapshot.docs
    .map((document: { id: string; data: () => unknown }) => ({
      ...(document.data() as RaceCatalogEntry),
      id: document.id,
    }))
    .filter(
      (entry: RaceCatalogEntry) =>
        entry.retired !== true &&
        !entry.duplicateOfCatalogRaceId &&
        isPlatform(entry.officialUrl) &&
        // Already resolved entries point somewhere else by definition.
        (!entry.sourceUrl || entry.sourceUrl === entry.officialUrl),
    )

  console.log(`${snapshot.size} entries, ${pending.length} still pointing at the listing`)
  const batchOfWork = pending.slice(0, Number.isFinite(limit) ? limit : pending.length)
  console.log(`reading ${batchOfWork.length} pages, one every ${DELAY_MS}ms\n`)

  let resolved = 0
  let noLink = 0
  let unreachable = 0

  for (const entry of batchOfWork) {
    const page = entry.officialUrl!
    try {
      const response = await fetch(page, {
        signal: AbortSignal.timeout(20_000),
        headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': USER_AGENT },
      })
      if (!response.ok) {
        unreachable += 1
        console.log(`  ${response.status} ${entry.id}`)
      } else {
        const organiser = readOrganiserLink(await response.text())
        if (!organiser) {
          noLink += 1
        } else {
          resolved += 1
          if (resolved <= 15) console.log(`  ${entry.id}: -> ${organiser}`)
          if (!dryRun) {
            await db
              .collection('raceCatalog')
              .doc(entry.id)
              .update({ officialUrl: organiser, sourceUrl: page })
          }
        }
      }
    } catch (error) {
      unreachable += 1
      console.log(`  failed ${entry.id}: ${(error as Error).message.slice(0, 40)}`)
    }
    await new Promise((wait) => setTimeout(wait, DELAY_MS))
  }

  console.log(
    `\n${resolved} resolved, ${noLink} pages with no organiser link, ${unreachable} unreachable` +
      (dryRun ? '\nDry run, nothing written.' : ''),
  )
}

await main()
