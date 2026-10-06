import { FIT_EPOCH_OFFSET_SECONDS, FIT_TIMESTAMP_FIELD } from './fit.js'
import type { FitMessage } from './fit.js'
import type { ParsedActivity, TrackLap, TrackPoint } from './types.js'

/** Global message numbers from the FIT profile. */
const SESSION = 18
const LAP = 19
const RECORD = 20

/** Record fields. */
const POSITION_LAT = 0
const POSITION_LONG = 1
const ALTITUDE = 2
const HEART_RATE = 3
const CADENCE = 4
const DISTANCE = 5
const ENHANCED_ALTITUDE = 78

/** Lap fields, which the session shares. */
const START_TIME = 2
const SPORT = 5
const TOTAL_ELAPSED_TIME = 7
const TOTAL_DISTANCE = 9
const TOTAL_CALORIES = 11
const AVG_HEART_RATE = 16
const MAX_HEART_RATE = 17

/** Positions are signed 32 bit fractions of a half turn. */
const DEGREES_PER_SEMICIRCLE = 180 / 2 ** 31

/** Altitude is stored as fifths of a metre above 500 m below sea level. */
const ALTITUDE_SCALE = 5
const ALTITUDE_OFFSET_METERS = 500

/** Distance in centimetres, times in milliseconds. */
const DISTANCE_SCALE = 100
const TIME_SCALE = 1000

/** The TCX words for the same sports, so both formats describe a run alike. */
const SPORT_NAMES: Record<number, string> = { 1: 'Running', 2: 'Biking' }

function fitTimeToMillis(seconds: number): number {
  return (seconds + FIT_EPOCH_OFFSET_SECONDS) * 1000
}

function altitudeOf(fields: Map<number, number>): number | undefined {
  // The enhanced field has the wider range and is preferred where both exist.
  const raw = fields.get(ENHANCED_ALTITUDE) ?? fields.get(ALTITUDE)
  return raw === undefined ? undefined : raw / ALTITUDE_SCALE - ALTITUDE_OFFSET_METERS
}

function parseRecord(message: FitMessage): TrackPoint | null {
  const { fields } = message
  const timestamp = fields.get(FIT_TIMESTAMP_FIELD)
  if (timestamp === undefined) return null

  const point: TrackPoint = { time: fitTimeToMillis(timestamp) }

  const lat = fields.get(POSITION_LAT)
  const lon = fields.get(POSITION_LONG)
  if (lat !== undefined && lon !== undefined) {
    point.lat = lat * DEGREES_PER_SEMICIRCLE
    point.lon = lon * DEGREES_PER_SEMICIRCLE
  }

  const elevation = altitudeOf(fields)
  if (elevation !== undefined) point.elevation = elevation

  const distance = fields.get(DISTANCE)
  if (distance !== undefined) point.deviceDistance = distance / DISTANCE_SCALE

  const heartRate = fields.get(HEART_RATE)
  if (heartRate !== undefined) point.heartRate = heartRate

  const cadence = fields.get(CADENCE)
  if (cadence !== undefined) point.cadenceRpm = cadence

  return point
}

function parseLap(message: FitMessage): TrackLap | null {
  const { fields } = message
  const startTime = fields.get(START_TIME)
  const elapsed = fields.get(TOTAL_ELAPSED_TIME)
  const distance = fields.get(TOTAL_DISTANCE)
  if (startTime === undefined || elapsed === undefined || distance === undefined) return null

  const lap: TrackLap = {
    startTime: fitTimeToMillis(startTime),
    durationSeconds: elapsed / TIME_SCALE,
    distanceMeters: distance / DISTANCE_SCALE,
  }

  const average = fields.get(AVG_HEART_RATE)
  if (average !== undefined) lap.averageHeartRate = average

  const maximum = fields.get(MAX_HEART_RATE)
  if (maximum !== undefined) lap.maximumHeartRate = maximum

  const calories = fields.get(TOTAL_CALORIES)
  if (calories !== undefined && calories > 0) lap.calories = calories

  return lap
}

export function parseFitMessages(messages: FitMessage[]): ParsedActivity | null {
  const points: TrackPoint[] = []
  const laps: TrackLap[] = []
  let sport: string | undefined

  for (const message of messages) {
    if (message.globalNumber === RECORD) {
      const point = parseRecord(message)
      if (point) points.push(point)
    } else if (message.globalNumber === LAP) {
      const lap = parseLap(message)
      if (lap) laps.push(lap)
    } else if (message.globalNumber === SESSION) {
      const code = message.fields.get(SPORT)
      if (code !== undefined) sport ??= SPORT_NAMES[code]
    }
  }

  if (points.length === 0) return null

  points.sort((a, b) => a.time - b.time)
  laps.sort((a, b) => a.startTime - b.startTime)

  return {
    format: 'fit',
    startedAt: new Date(points[0].time),
    ...(sport ? { sport } : {}),
    points,
    laps,
  }
}
