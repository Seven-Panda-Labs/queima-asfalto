import type { ParsedActivity, TrackPoint } from './types'
import {
  childNumber,
  descendantsByLocalName,
  parseNumericAttribute,
  parseTimestamp,
  textByLocalName,
} from './xml'

/** GPX carries no sensor data of its own: anything beyond position is a vendor extension. */
export function parseGpxDocument(document: Document): ParsedActivity | null {
  const points: TrackPoint[] = []

  for (const element of descendantsByLocalName(document, 'trkpt')) {
    const time = parseTimestamp(textByLocalName(element, 'time'))
    if (time === undefined) continue

    const point: TrackPoint = { time }

    const lat = parseNumericAttribute(element, 'lat')
    const lon = parseNumericAttribute(element, 'lon')
    if (lat !== undefined && lon !== undefined) {
      point.lat = lat
      point.lon = lon
    }

    const elevation = childNumber(element, 'ele')
    if (elevation !== undefined) point.elevation = elevation

    points.push(point)
  }

  if (points.length === 0) return null

  points.sort((a, b) => a.time - b.time)

  return {
    format: 'gpx',
    startedAt: new Date(points[0].time),
    points,
    laps: [],
  }
}
