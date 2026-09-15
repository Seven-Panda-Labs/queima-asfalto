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

/**
 * A TCX shaped like the Fünf-Seen-Lauf export.
 *
 * The watch stamps time and heart rate from the first second, reports distance a
 * few seconds later, and only fixes a position once the GPS has settled, which
 * takes minutes. All three series are ragged at the head in different ways.
 */
function tcxWithRaggedStart(options: {
  pointsBeforeDistance: number
  pointsBeforePosition: number
  movingPoints: number
  metresPerPoint: number
  distanceEvery?: number
  /** Index past which the barometer reports nothing. */
  altitudeUntil?: number
}): string {
  const {
    pointsBeforeDistance,
    pointsBeforePosition,
    movingPoints,
    metresPerPoint,
    distanceEvery = 1,
    altitudeUntil = Number.POSITIVE_INFINITY,
  } = options
  const start = Date.parse('2026-07-04T08:46:36.000Z')
  const at = (index: number) => new Date(start + index * 1000).toISOString()

  const points = Array.from({ length: movingPoints }, (_unused, index) => {
    const metres = Math.max(0, index - pointsBeforeDistance + 1) * metresPerPoint
    const distance =
      index >= pointsBeforeDistance && index % distanceEvery === 0
        ? `<DistanceMeters>${metres}</DistanceMeters>`
        : ''
    const position =
      index >= pointsBeforePosition
        ? `<Position><LatitudeDegrees>${(52.5 + index / 100000).toFixed(6)}</LatitudeDegrees>` +
          `<LongitudeDegrees>13.4</LongitudeDegrees></Position>`
        : ''
    // A gentle climb, so a trusted series has a gain worth reporting.
    const altitude =
      index <= altitudeUntil ? `<AltitudeMeters>${35 + index / 10}</AltitudeMeters>` : ''
    return (
      `<Trackpoint><Time>${at(index)}</Time>${position}` +
      `${altitude}${distance}` +
      `<HeartRateBpm><Value>170</Value></HeartRateBpm></Trackpoint>`
    )
  })

  return (
    `<?xml version="1.0"?><TrainingCenterDatabase ` +
    `xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">` +
    `<Activities><Activity Sport="Running"><Lap StartTime="${at(0)}">` +
    `<TotalTimeSeconds>${movingPoints}</TotalTimeSeconds>` +
    `<DistanceMeters>${movingPoints * metresPerPoint}</DistanceMeters>` +
    `<TriggerMethod>Distance</TriggerMethod><Track>` +
    points.join('') +
    `</Track></Lap></Activity></Activities></TrainingCenterDatabase>`
  )
}

describe('a watch whose readings start late', () => {
  // The Fünf-Seen-Lauf export: no distance on the first 4 points, no position on
  // the first 236. Demanding a reading on every point sent 21 km of watch data
  // to the GPS fallback, which then measured the positionless head as standing
  // still and charged four minutes of running to the first kilometre.
  const ragged = summarizeActivity(
    parse(
      tcxWithRaggedStart({
        pointsBeforeDistance: 4,
        pointsBeforePosition: 236,
        movingPoints: 700,
        metresPerPoint: 3,
      }),
    ),
  )

  it('takes the distance from the watch despite the ragged head', () => {
    expect(ragged.distanceSource).toBe('device')
  })

  it('measures the positionless stretch instead of reading it as standing still', () => {
    // 3 m/s over 700 points, minus the few seconds before the first reading.
    expect(ragged.distanceMeters).toBeGreaterThan(2000)
  })

  it('keeps the first kilometre honest', () => {
    // A kilometre at 3 m/s is about 333 s. The fallback used to report this one
    // at roughly twice that, because the head counted as time without distance.
    expect(ragged.splits[0].paceSecondsPerKm).toBeLessThan(345)
  })

  it('falls back when the readings are too sparse to be a series', () => {
    const sparse = summarizeActivity(
      parse(
        tcxWithRaggedStart({
          pointsBeforeDistance: 4,
          pointsBeforePosition: 10,
          movingPoints: 100,
          metresPerPoint: 3,
          distanceEvery: 40,
        }),
      ),
    )
    expect(sparse.distanceSource).toBe('computed')
  })
})

describe('a barometer that gives up partway', () => {
  // The Tierparklauf export: altitude on 55% of points, stuck at 0.91 m from
  // halfway on. The arithmetic was right and said the race climbed nothing.
  const halfMeasured = summarizeActivity(
    parse(
      tcxWithRaggedStart({
        pointsBeforeDistance: 0,
        pointsBeforePosition: 0,
        movingPoints: 600,
        metresPerPoint: 3,
        altitudeUntil: 300,
      }),
    ),
  )

  const fullyMeasured = summarizeActivity(
    parse(
      tcxWithRaggedStart({
        pointsBeforeDistance: 0,
        pointsBeforePosition: 0,
        movingPoints: 600,
        metresPerPoint: 3,
      }),
    ),
  )

  it('declines to put a number on the climb', () => {
    expect(halfMeasured.elevationGainMeters).toBeUndefined()
    expect(halfMeasured.elevationLossMeters).toBeUndefined()
  })

  it('keeps altitude off the chart as well, rather than drawing half a race', () => {
    // One trust decision: a series unfit to summarise is unfit to plot.
    expect(halfMeasured.profile.every((point) => point.elevationMeters === undefined)).toBe(true)
  })

  it('still reports the distance and the pace, which are unaffected', () => {
    expect(halfMeasured.distanceSource).toBe('device')
    expect(halfMeasured.splits.length).toBeGreaterThan(0)
  })

  it('leaves a complete series alone', () => {
    expect(fullyMeasured.elevationGainMeters).toBeGreaterThan(0)
    expect(fullyMeasured.profile.some((point) => point.elevationMeters !== undefined)).toBe(true)
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
    expect(Math.abs(gpx.elevationGainMeters! - gpx.elevationLossMeters!)).toBeLessThan(20)
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

describe('profile', () => {
  it('never samples finer than the minimum bucket, whatever the budget', () => {
    // A 5 km at the budget alone would use 41 m buckets, where one bad GPS fix
    // reads as a 2:46/km kilometre.
    expect(gpx.profile).toHaveLength(49)
    expect(tcx.profile).toHaveLength(49)
    expect(gpx.distanceMeters / gpx.profile.length).toBeGreaterThanOrEqual(100)
  })

  it('advances monotonically and finishes on the measured distance', () => {
    const distances = gpx.profile.map((point) => point.distanceMeters)
    expect(distances.every((value, index) => index === 0 || value > distances[index - 1])).toBe(
      true,
    )
    expect(distances.at(-1)).toBe(Math.round(gpx.distanceMeters))
  })

  it('smooths pace into a plausible band instead of raw GPS noise', () => {
    // The run averaged 5:19/km, and the smoothed series spans 3:37 to 6:25.
    const paces = gpx.profile.map((point) => point.paceSecondsPerKm)
    expect(Math.min(...paces)).toBeGreaterThan(200)
    expect(Math.max(...paces)).toBeLessThan(420)
  })

  it('produces the same shape from either export of the same run', () => {
    const gpxPaces = gpx.profile.map((point) => point.paceSecondsPerKm)
    const tcxPaces = tcx.profile.map((point) => point.paceSecondsPerKm)
    expect(Math.abs(Math.min(...gpxPaces) - Math.min(...tcxPaces))).toBeLessThan(15)
    expect(Math.abs(Math.max(...gpxPaces) - Math.max(...tcxPaces))).toBeLessThan(15)
  })

  it('carries elevation when the file has it', () => {
    expect(gpx.profile.every((point) => point.elevationMeters !== undefined)).toBe(true)
    expect(tcx.profile.every((point) => point.elevationMeters !== undefined)).toBe(true)
  })

  it('averages to about the same pace as the summary', () => {
    const mean =
      gpx.profile.reduce((sum, point) => sum + point.paceSecondsPerKm, 0) / gpx.profile.length
    expect(Math.abs(mean - gpx.averagePaceSecondsPerKm)).toBeLessThan(5)
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
