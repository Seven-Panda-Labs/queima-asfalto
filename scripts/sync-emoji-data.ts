/**
 * Copy self-hosted emoji-picker-element data files into public/emoji-data/,
 * one per supported app language, so the emoji picker never depends on the
 * jsDelivr CDN it defaults to.
 *
 * Usage: npx tsx scripts/sync-emoji-data.ts
 * Output: public/emoji-data/{en,pt,es,de,fr}.json
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const OUTPUT_DIR = resolve(import.meta.dirname, '../public/emoji-data')
const LOCALES = ['en', 'pt', 'es', 'de', 'fr']

mkdirSync(OUTPUT_DIR, { recursive: true })

for (const locale of LOCALES) {
  const source = require.resolve(`emoji-picker-element-data/${locale}/cldr/data.json`)
  const destination = resolve(OUTPUT_DIR, `${locale}.json`)
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(source, destination)
  console.log(`Copied ${source} -> ${destination}`)
}
