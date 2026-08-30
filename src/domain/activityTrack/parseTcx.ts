import type { ParsedActivity, TrackLap, TrackPoint } from './types'
import {
  childByLocalName,
  childNumber,
  childWrappedValue,
  descendantsByLocalName,
  parseTimestamp,
  textByLocalName,
} from './xml'

/** Zero on a lap aggregate means the device wrote nothing there, not a real zero. */
function positiveOrUndefined(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 ? value : undefined
}

function parseTrackpoint(element: Element): TrackPoint | null {
  const time = parseTimestamp(textByLocalName(element, 'Time'))
  if (time === undefined) return null

  const point: TrackPoint = { time }

  // Absent while the GPS is still locking on, and in tunnels.
  const position = childByLocalName(element, 'Position')
  if (position) {
    const lat = childNumber(position, 'LatitudeDegrees')
    const lon = childNumber(position, 'LongitudeDegrees')
    if (lat !== undefined && lon !== undefined) {
      point.lat = lat
      point.lon = lon
    }
  }

  const elevation = childNumber(element, 'AltitudeMeters')
  if (elevation !== undefined) point.elevation = elevation

  const deviceDistance = childNumber(element, 'DistanceMeters')
  if (deviceDistance !== undefined) point.deviceDistance = deviceDistance

  const heartRate = childWrappedValue(element, 'HeartRateBpm')
  if (heartRate !== undefined) point.heartRate = heartRate

  const cadence = childNumber(element, 'Cadence')
  if (cadence !== undefined) point.cadenceRpm = cadence

  return point
}

function parseLap(element: Element): TrackLap | null {
  const startTime = parseTimestamp(element.getAttribute('StartTime') ?? undefined)
  const durationSeconds = childNumber(element, 'TotalTimeSeconds')
  const distanceMeters = childNumber(element, 'DistanceMeters')
  if (startTime === undefined || durationSeconds === undefined || distanceMeters === undefined) {
    return null
  }

  const lap: TrackLap = { startTime, durationSeconds, distanceMeters }

  const average = childWrappedValue(element, 'AverageHeartRateBpm')
  if (average !== undefined) lap.averageHeartRate = average

  const maximum = childWrappedValue(element, 'MaximumHeartRateBpm')
  if (maximum !== undefined) lap.maximumHeartRate = maximum

  const calories = positiveOrUndefined(childNumber(element, 'Calories'))
  if (calories !== undefined) lap.calories = calories

  return lap
}

export function parseTcxDocument(document: Document): ParsedActivity | null {
  const points: TrackPoint[] = []
  for (const element of descendantsByLocalName(document, 'Trackpoint')) {
    const point = parseTrackpoint(element)
    if (point) points.push(point)
  }

  if (points.length === 0) return null

  const laps: TrackLap[] = []
  for (const element of descendantsByLocalName(document, 'Lap')) {
    const lap = parseLap(element)
    if (lap) laps.push(lap)
  }

  points.sort((a, b) => a.time - b.time)
  laps.sort((a, b) => a.startTime - b.startTime)

  const activity = descendantsByLocalName(document, 'Activity')[0]
  const sport = activity?.getAttribute('Sport')?.trim()

  return {
    format: 'tcx',
    startedAt: new Date(points[0].time),
    ...(sport ? { sport } : {}),
    points,
    laps,
  }
}
