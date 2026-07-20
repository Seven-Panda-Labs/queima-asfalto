import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  parseParkrunAthleteFromEventResults,
  parseParkrunEventResultsDate,
} from '../../functions/src/connectors/parkrun.js'

describe('parseParkrunEventResults', () => {
  const html = readFileSync(
    resolve(import.meta.dirname, 'fixtures/parkrun-event-results-athlete-snippet.html'),
    'utf8',
  )

  it('reads event date from results page', () => {
    expect(parseParkrunEventResultsDate(html)).toBe('2026-07-18')
  })

  it('finds athlete row by parkrunner id', () => {
    expect(parseParkrunAthleteFromEventResults(html, '1078662')).toEqual({
      matchedName: 'Colin KING',
      time: '00:31:57',
      position: 124,
    })
  })

  it('returns undefined when athlete is missing', () => {
    expect(parseParkrunAthleteFromEventResults(html, '9999999')).toBeUndefined()
  })
})
