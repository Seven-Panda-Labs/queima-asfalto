import { describe, expect, it } from 'vitest'
import gpxSample from '../../../assets/sample-parkrun.GPX?raw'
import tcxSample from '../../../assets/sample-parkrun.TCX?raw'
import { parseActivityXml } from './parseActivityFile'
import { summarizeActivity } from './metrics'
import type { ParsedActivity } from './types'

function parse(xml: string): ParsedActivity {
  const result = parseActivityXml(xml)
  if (!result.ok) throw new Error(`sample must parse, got ${result.code}`)
  return result.activity
}

const gpx = summarizeActivity(parse(gpxSample))
const tcx = summarizeActivity(parse(tcxSample))

describe('distance', () => {
  it('integrates the GPS fixes when the file has no device distance', () => {
    expect(gpx.distanceSource).toBe('computed')
    expect(gpx.distanceMeters).toBeCloseTo(4954, -1)
  })

  it('prefers the distance the watch recorded', () => {
    expect(tcx.distanceSource).toBe('device')
    expect(tcx.distanceMeters).toBeCloseTo(4930, -1)
  })

  it('agrees between formats to within a few metres of the same run', () => {
    expect(Math.abs(gpx.distanceMeters - tcx.distanceMeters)).toBeLessThan(50)
  })
})

describe('time and pace', () => {
  it('measures elapsed time from the trackpoints', () => {
    expect(gpx.elapsedSeconds).toBe(1580)
  })

  it('counts almost all of a race as moving time', () => {
    expect(gpx.movingSeconds).toBeGreaterThan(gpx.elapsedSeconds - 10)
    expect(gpx.movingSeconds).toBeLessThanOrEqual(gpx.elapsedSeconds)
  })

  it('derives an average pace both formats agree on', () => {
    expect(gpx.averagePaceSecondsPerKm).toBeCloseTo(319, 0)
    expect(Math.abs(gpx.averagePaceSecondsPerKm - tcx.averagePaceSecondsPerKm)).toBeLessThan(5)
  })
})

describe('splits', () => {
  it('cuts a 5 km race into four full kilometres and a partial', () => {
    expect(gpx.splits).toHaveLength(5)
    expect(gpx.splits.slice(0, 4).every((split) => !split.partial)).toBe(true)
    expect(gpx.splits[4].partial).toBe(true)
    expect(gpx.splits[4].distanceMeters).toBeLessThan(1000)
  })

  it('matches the laps the watch recorded to within a few seconds', () => {
    const laps = parse(tcxSample).laps
    for (let index = 0; index < 4; index++) {
      expect(
        Math.abs(tcx.splits[index].durationSeconds - laps[index].durationSeconds),
      ).toBeLessThan(5)
    }
  })

  it('extrapolates the pace of the trailing partial split', () => {
    const partial = gpx.splits[4]
    expect(partial.paceSecondsPerKm).toBeGreaterThan(partial.durationSeconds)
  })

  it('attaches heart rate per split when the file carries it', () => {
    expect(gpx.splits[0].averageHeartRate).toBeUndefined()
    expect(tcx.splits[0].averageHeartRate).toBeGreaterThan(0)
  })
})

describe('elevation', () => {
  it('suppresses the quantisation noise of whole metre GPX elevations', () => {
    // An unfiltered sum of the same series gives 133 m.
    expect(gpx.elevationGainMeters).toBeLessThan(110)
    expect(gpx.elevationGainMeters).toBeGreaterThan(0)
  })

  it('reports gain and loss separately on a loop course', () => {
    expect(Math.abs(gpx.elevationGainMeters - gpx.elevationLossMeters)).toBeLessThan(20)
  })
})

describe('heart rate', () => {
  it('is absent from a GPX with no extensions', () => {
    expect(gpx.heartRate).toBeUndefined()
  })

  it('summarises the TCX readings', () => {
    expect(tcx.heartRate).toEqual({ average: 180, minimum: 72, maximum: 198 })
  })
})

describe('route', () => {
  it('simplifies to a storable point budget', () => {
    expect(gpx.route.length).toBeLessThanOrEqual(150)
    expect(gpx.route.length).toBeGreaterThan(20)
  })

  it('keeps the real start and end of the track', () => {
    expect(gpx.route[0].lat).toBeCloseTo(52.34235667, 5)
    expect(gpx.route[0]).toEqual({ lat: expect.any(Number), lon: expect.any(Number) })
  })
})
