#!/usr/bin/env npx tsx
/**
 * Verifica licenças de dependências de produção (root + functions).
 *
 * Uso:
 *   npm run check:licenses
 *   npm run check:licenses -- --dev   # inclui devDependencies (root)
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const BIN = resolve(ROOT, 'node_modules/.bin/license-checker-rseidelsohn')

const rootPackage = JSON.parse(
  readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
) as { name: string; version: string }

/** Root app is AGPL (not a dependency); license-checker misreads LICENSE/README — exclude by current version. */
const EXCLUDE_PACKAGES = `${rootPackage.name}@${rootPackage.version};queima-asfalto-functions`

const PRODUCTION_ALLOW = [
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'ISC',
  '0BSD',
  'MPL-2.0',
  'Hippocratic-2.1',
  'Custom: LICENSE', // react-leaflet-cluster (MIT on disk; package.json uses SEE LICENSE IN LICENSE)
].join(';')

const DEVELOPMENT_EXTRA = [
  'BlueOak-1.0.0',
  'MIT-0',
  'CC0-1.0',
  '(MIT OR CC0-1.0)',
  '(BSD-2-Clause OR MIT OR Apache-2.0)',
  'Python-2.0',
  'CC-BY-4.0',
  'Public Domain',
  'BSD*',
  'MIT*',
].join(';')

const includeDev = process.argv.includes('--dev')

function runChecker(options: {
  cwd: string
  label: string
  production: boolean
  onlyAllow: string
}): void {
  const { cwd, label, production, onlyAllow } = options
  const args = [
    production ? '--production' : '--development',
    '--summary',
    '--excludePackages',
    EXCLUDE_PACKAGES,
    '--onlyAllow',
    onlyAllow,
    '--excludePrivatePackages',
  ]

  const result = spawnSync(BIN, args, {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    console.error(`\nLicense check failed: ${label}`)
    process.exit(result.status ?? 1)
  }

  console.log(`License check passed: ${label}`)
}

if (!existsSync(BIN)) {
  console.error('Missing license-checker-rseidelsohn. Run npm install.')
  process.exit(1)
}

const functionsDir = resolve(ROOT, 'functions')
if (!existsSync(resolve(functionsDir, 'node_modules'))) {
  console.error('Missing functions/node_modules. Run: npm --prefix functions install')
  process.exit(1)
}

const devAllow = `${PRODUCTION_ALLOW};${DEVELOPMENT_EXTRA}`

runChecker({
  cwd: ROOT,
  label: 'root (production)',
  production: true,
  onlyAllow: PRODUCTION_ALLOW,
})

runChecker({
  cwd: functionsDir,
  label: 'functions (production)',
  production: true,
  onlyAllow: PRODUCTION_ALLOW,
})

if (includeDev) {
  runChecker({
    cwd: ROOT,
    label: 'root (development)',
    production: false,
    onlyAllow: devAllow,
  })
}
