import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The deployed bundle has to be importable, which is not the same as compiling.
 *
 * Cloud Run starts the container and waits for it to listen. Anything that
 * throws while `index.js` is being imported fails that health check, and it
 * fails it for every function in the bundle at once: a single option out of
 * range took the whole deploy down, with `tsc` and the tests all green.
 *
 * Skipped when `lib/` has not been built, so `npm test` on its own still works.
 * `npm run check` builds the functions first, which is where this earns its
 * place.
 */
const ENTRY = resolve(import.meta.dirname, '../lib/index.js')

describe('the compiled functions bundle', () => {
  it.skipIf(!existsSync(ENTRY))('can be imported the way the container does', async () => {
    await expect(import(ENTRY)).resolves.toBeDefined()
  })
})
