import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseParkrunFinishers } from '../../functions/src/connectors/parkrun.js'

describe('parseParkrunFinishers', () => {
  it('reads finishers count from event results page', () => {
    const html = readFileSync(
      resolve(import.meta.dirname, 'fixtures/parkrun-event-results-snippet.html'),
      'utf8',
    )
    expect(parseParkrunFinishers(html)).toBe(218)
  })
})
