import { describe, expect, it } from 'vitest'
import { FIT_TIMESTAMP_FIELD } from './fit'
import {
  buildFitFile,
  ENUM,
  fitSeconds,
  semicircles,
  SINT32,
  UINT8,
  UINT16,
  UINT32,
  type FitRecordSpec,
} from './fixtures/fitFile'
import { summarizeActivity } from './metrics'
import { parseActivityBytes } from './parseActivityFile'

const START = '2026-07-04T08:46:36.000Z'
const MOVING_POINTS = 300
const METRES_PER_SECOND = 3

const recordFields = [
  { number: FIT_TIMESTAMP_FIELD, baseType: UINT32, bytes: 4 },
  { number: 0, baseType: SINT32, bytes: 4 },
  { number: 1, baseType: SINT32, bytes: 4 },
  { number: 78, baseType: UINT32, bytes: 4 },
  { number: 5, baseType: UINT32, bytes: 4 },
  { number: 3, baseType: UINT8, bytes: 1 },
  { number: 4, baseType: UINT8, bytes: 1 },
]

/** Fifths of a metre above -500 m, the way FIT stores altitude. */
const altitudeField = (metres: number) => (metres + 500) * 5

/**
 * A five minute run: 3 m/s, climbing a fifth of a metre a second, with the
 * GPS still locking on for the first two seconds.
 */
function fitRun(): FitRecordSpec[] {
  const t0 = fitSeconds(START)
  const records: FitRecordSpec[] = [
    { define: { localNumber: 0, globalNumber: 20, fields: recordFields } },
  ]
  for (let index = 0; index < MOVING_POINTS; index += 1) {
    const locked = index >= 2
    records.push({
      data: {
        localNumber: 0,
        values: [
          t0 + index,
          locked ? semicircles(52.5 + index / 100000) : null,
          locked ? semicircles(13.4) : null,
          altitudeField(35 + index / 5),
          index * METRES_PER_SECOND * 100,
          150 + (index % 20),
          85,
        ],
      },
    })
  }
  records.push(
    {
      define: {
        localNumber: 1,
        globalNumber: 19,
        fields: [
          { number: 2, baseType: UINT32, bytes: 4 },
          { number: 7, baseType: UINT32, bytes: 4 },
          { number: 9, baseType: UINT32, bytes: 4 },
          { number: 11, baseType: UINT16, bytes: 2 },
          { number: 16, baseType: UINT8, bytes: 1 },
          { number: 17, baseType: UINT8, bytes: 1 },
        ],
      },
    },
    { data: { localNumber: 1, values: [t0, 300_000, 90_000, 61, 159, 169] } },
    {
      define: {
        localNumber: 2,
        globalNumber: 18,
        fields: [{ number: 5, baseType: ENUM, bytes: 1 }],
      },
    },
    { data: { localNumber: 2, values: [1] } },
  )
  return records
}

function parse(records: FitRecordSpec[]) {
  const result = parseActivityBytes(buildFitFile(records))
  if (!result.ok) throw new Error(`expected a parse, got ${result.code}`)
  return result.activity
}

describe('FIT parsing', () => {
  const activity = parse(fitRun())

  it('names the format and the sport in the words TCX uses', () => {
    expect(activity.format).toBe('fit')
    expect(activity.sport).toBe('Running')
  })

  it('converts the FIT clock, which starts in 1989, to real time', () => {
    expect(activity.startedAt.toISOString()).toBe(START)
    expect(activity.points[1].time - activity.points[0].time).toBe(1000)
  })

  it('turns semicircles into degrees', () => {
    expect(activity.points[10].lat).toBeCloseTo(52.5001, 6)
    expect(activity.points[10].lon).toBeCloseTo(13.4, 6)
  })

  it('keeps a point the GPS had not fixed yet, without a position', () => {
    expect(activity.points).toHaveLength(MOVING_POINTS)
    expect(activity.points[0].lat).toBeUndefined()
    expect(activity.points[0].heartRate).toBe(150)
  })

  it('reads altitude in metres, keeping its fractions', () => {
    expect(activity.points[11].elevation).toBeCloseTo(37.2, 6)
  })

  it('reads the device distance in metres', () => {
    expect(activity.points[10].deviceDistance).toBe(30)
  })

  it('reads the lap as the device recorded it', () => {
    expect(activity.laps).toEqual([
      {
        startTime: Date.parse(START),
        durationSeconds: 300,
        distanceMeters: 900,
        calories: 61,
        averageHeartRate: 159,
        maximumHeartRate: 169,
      },
    ])
  })

  it('feeds the same summary a TCX would', () => {
    const summary = summarizeActivity(activity)
    expect(summary.distanceSource).toBe('device')
    expect(summary.distanceMeters).toBe((MOVING_POINTS - 1) * METRES_PER_SECOND)
    // 59.8 m of steady climb, counted in steps of at least 3 m.
    expect(summary.elevationGainMeters).toBeGreaterThanOrEqual(57)
    expect(summary.elevationGainMeters).toBeLessThanOrEqual(60)
    expect(summary.heartRate?.maximum).toBe(169)
  })
})

describe('FIT edge cases', () => {
  it('falls back to the older altitude field when the enhanced one is absent', () => {
    const t0 = fitSeconds(START)
    const activity = parse([
      {
        define: {
          localNumber: 0,
          globalNumber: 20,
          fields: [
            { number: FIT_TIMESTAMP_FIELD, baseType: UINT32, bytes: 4 },
            { number: 2, baseType: UINT16, bytes: 2 },
          ],
        },
      },
      { data: { localNumber: 0, values: [t0, altitudeField(-12.4)] } },
    ])
    expect(activity.points[0].elevation).toBeCloseTo(-12.4, 6)
  })

  it('skips a record with no timestamp', () => {
    const records = fitRun()
    const first = records[1]
    if ('data' in first) first.data.values[0] = null
    expect(parse(records).points).toHaveLength(MOVING_POINTS - 1)
  })

  it('reports a file with no records the way it reports an empty track', () => {
    const result = parseActivityBytes(
      buildFitFile([
        { define: { localNumber: 0, globalNumber: 18, fields: [{ number: 5, baseType: ENUM, bytes: 1 }] } },
        { data: { localNumber: 0, values: [1] } },
      ]),
    )
    expect(result).toEqual({ ok: false, code: 'no_track_points' })
  })

  it('reports a broken header the way it reports broken XML', () => {
    const file = buildFitFile(fitRun())
    file[0] = 200
    expect(parseActivityBytes(file)).toEqual({ ok: false, code: 'malformed_xml' })
  })
})
