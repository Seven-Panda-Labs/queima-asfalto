import { describe, expect, it } from 'vitest'
import {
  formatDistanceInput,
  KM_PER_MILE,
  paceToSecondsPerKm,
  parseDistanceKm,
  partsToSeconds,
  secondsPerKmToPace,
  solvePace,
} from './paceCalculator'

describe('parseDistanceKm', () => {
  it('reads a dot or a comma as the decimal separator', () => {
    expect(parseDistanceKm('21.0975')).toBe(21.0975)
    expect(parseDistanceKm('21,1')).toBe(21.1)
  })

  it('rejects blank, zero and malformed input', () => {
    expect(parseDistanceKm('')).toBeNull()
    expect(parseDistanceKm('0')).toBeNull()
    expect(parseDistanceKm('-5')).toBeNull()
    expect(parseDistanceKm('10km')).toBeNull()
  })
})

describe('partsToSeconds', () => {
  it('treats blank parts as zero', () => {
    expect(partsToSeconds(['', '45', ''])).toBe(2700)
    expect(partsToSeconds(['1', '', '5'])).toBe(3605)
  })

  it('returns null for a blank, zero or malformed time', () => {
    expect(partsToSeconds(['', '', ''])).toBeNull()
    expect(partsToSeconds(['0', '0', '0'])).toBeNull()
    expect(partsToSeconds(['', '4.5', ''])).toBeNull()
  })
})

describe('pace units', () => {
  it('converts between min/km and min/mile', () => {
    expect(paceToSecondsPerKm(KM_PER_MILE * 300, 'mi')).toBeCloseTo(300)
    expect(secondsPerKmToPace(300, 'mi')).toBeCloseTo(482.8, 1)
    expect(secondsPerKmToPace(300, 'km')).toBe(300)
  })
})

describe('solvePace', () => {
  it('finds the pace from distance and time', () => {
    const result = solvePace('pace', { distanceKm: 10, timeSeconds: 2700, paceSecondsPerKm: null })
    expect(result?.paceSecondsPerKm).toBe(270)
  })

  it('finds the time from distance and pace', () => {
    const result = solvePace('time', { distanceKm: 42.195, timeSeconds: null, paceSecondsPerKm: 300 })
    expect(result?.timeSeconds).toBeCloseTo(12658.5)
  })

  it('finds the distance from time and pace', () => {
    const result = solvePace('distance', { distanceKm: null, timeSeconds: 3600, paceSecondsPerKm: 300 })
    expect(result?.distanceKm).toBe(12)
  })

  it('ignores the value it is solving for', () => {
    const result = solvePace('pace', { distanceKm: 5, timeSeconds: 1500, paceSecondsPerKm: 999 })
    expect(result?.paceSecondsPerKm).toBe(300)
  })

  it('waits for both inputs', () => {
    expect(solvePace('pace', { distanceKm: 5, timeSeconds: null, paceSecondsPerKm: null })).toBeNull()
  })
})

describe('formatDistanceInput', () => {
  it('writes a distance in the chosen unit, to three decimals', () => {
    expect(formatDistanceInput(42.195, 'mi')).toBe('26.219')
    expect(formatDistanceInput(5, 'km')).toBe('5')
  })
})
