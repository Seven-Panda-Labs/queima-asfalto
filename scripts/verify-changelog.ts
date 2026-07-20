#!/usr/bin/env npx tsx
/**
 * Verifica que a versão em package.json coincide com a entrada mais recente
 * em change-log.md e change-log.en.md.
 *
 * Uso: npm run check:changelog
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PACKAGE_JSON = resolve(ROOT, 'package.json')
const CHANGELOG_FILES = [
  { path: resolve(ROOT, 'change-log.md'), label: 'change-log.md' },
  { path: resolve(ROOT, 'change-log.en.md'), label: 'change-log.en.md' },
] as const

const packageVersion = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')).version as string

function readTopVersion(filePath: string, label: string): string {
  const changelog = readFileSync(filePath, 'utf8')
  const match = changelog.match(/^## \[([^\]]+)\]/m)
  const version = match?.[1]

  if (!version) {
    console.error(`${label}: no ## [X.Y.Z] section found`)
    process.exit(1)
  }

  return version
}

const versions = CHANGELOG_FILES.map(({ path, label }) => ({
  label,
  version: readTopVersion(path, label),
}))

const mismatched = versions.filter(({ version }) => version !== packageVersion)
if (mismatched.length > 0) {
  for (const { label, version } of mismatched) {
    console.error(
      `Version mismatch: package.json is "${packageVersion}" but ${label} starts at "${version}".`,
    )
  }
  console.error(
    `Add a ## [${packageVersion}] — YYYY-MM-DD section at the top of both change-log.md and change-log.en.md.`,
  )
  process.exit(1)
}

const uniqueVersions = new Set(versions.map(({ version }) => version))
if (uniqueVersions.size > 1) {
  console.error('Changelog language files are out of sync:')
  for (const { label, version } of versions) {
    console.error(`  ${label}: ${version}`)
  }
  process.exit(1)
}

for (const { label, version } of versions) {
  console.log(`${label} aligned with package.json (${version})`)
}
