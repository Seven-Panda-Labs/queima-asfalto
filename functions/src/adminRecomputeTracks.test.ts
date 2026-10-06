// @vitest-environment node
//
// Node on purpose. The default jsdom environment supplies a DOMParser of its
// own, so this file would pass without the injection it exists to test.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The parser reads XML through the host's `DOMParser`. Node has none, and the
 * functions tsconfig carries the DOM types regardless, so nothing catches its
 * absence until the function runs. This is the test that does.
 *
 * Skipped until the functions build has copied `shared/` in, the same way the
 * bundle test waits for `lib/`. `npm run check` builds first.
 */
const PARSER = resolve(import.meta.dirname, 'shared/activityTrack/parseActivityFile.ts')
const METRICS = resolve(import.meta.dirname, 'shared/activityTrack/metrics.ts')
const SAMPLE = resolve(import.meta.dirname, '../../assets/sample-parkrun.TCX')
const FIT_FIXTURE = resolve(import.meta.dirname, '../../shared/activityTrack/fixtures/fitFile.ts')

describe('the recompute function running the app parser in Node', () => {
  it.skipIf(!existsSync(PARSER))('installs a DOMParser the shared parser can use', async () => {
    expect((globalThis as { DOMParser?: unknown }).DOMParser).toBeUndefined()

    await import('./adminRecomputeTracks.js')
    expect((globalThis as { DOMParser?: unknown }).DOMParser).toBeDefined()

    const { parseActivityBytes } = await import(PARSER)
    const { summarizeActivity } = await import(METRICS)

    // A Buffer, as Storage hands it over, through the entry point the function uses.
    const parsed = parseActivityBytes(readFileSync(SAMPLE))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    // The same figures the browser produces from the same file.
    const summary = summarizeActivity(parsed.activity)
    expect(summary.distanceSource).toBe('device')
    expect(Math.round(summary.distanceMeters)).toBe(4930)
    expect(summary.heartRate).toEqual({ average: 180, minimum: 72, maximum: 198 })
  })

  it.skipIf(!existsSync(PARSER))('reports malformed XML instead of throwing', async () => {
    await import('./adminRecomputeTracks.js')
    const { parseActivityBytes } = await import(PARSER)

    // A browser DOMParser returns a parsererror document; this one throws.
    expect(parseActivityBytes(Buffer.from('<gpx><trk>'))).toEqual({
      ok: false,
      code: 'malformed_xml',
    })
  })

  it.skipIf(!existsSync(PARSER))('reads a FIT, which needs no DOMParser at all', async () => {
    const { parseActivityBytes } = await import(PARSER)
    const { buildFitFile, fitSeconds, UINT8, UINT32 } = await import(FIT_FIXTURE)

    const t0 = fitSeconds('2026-07-04T08:46:36Z')
    const file = buildFitFile([
      {
        define: {
          localNumber: 0,
          globalNumber: 20,
          fields: [
            { number: 253, baseType: UINT32, bytes: 4 },
            { number: 3, baseType: UINT8, bytes: 1 },
          ],
        },
      },
      { data: { localNumber: 0, values: [t0, 150] } },
    ])

    const parsed = parseActivityBytes(Buffer.from(file))
    expect(parsed.ok && parsed.activity.format).toBe('fit')
  })
})
