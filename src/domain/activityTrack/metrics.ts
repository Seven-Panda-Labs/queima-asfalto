import type { ParsedActivity, TrackPoint } from './types'
import { simplifyRoute, type RoutePoint } from './simplify'

const EARTH_RADIUS_METERS = 6371000
const SPLIT_DISTANCE_METERS = 1000

/** Below this the runner is stopped, not moving slowly: GPS jitter alone clears it. */
const MOVING_SPEED_THRESHOLD_MPS = 0.5

/**
 * GPX rounds elevation to whole metres, so an unfiltered sum counts quantisation
 * steps as terrain. This is a noise floor, not a way to make formats agree: the two
 * sample exports of the same run carry genuinely different altitude series.
 */
const ELEVATION_NOISE_THRESHOLD_METERS = 3

/** Keeps a stored route under a few kilobytes whatever the race distance. */
const ROUTE_POINT_BUDGET = 150

export type TrackSplit = {
  /** 1 for the first kilometre. */
  index: number
  distanceMeters: number
  durationSeconds: number
  paceSecondsPerKm: number
  averageHeartRate?: number
  /** A trailing split short of a full kilometre, so its pace is extrapolated. */
  partial: boolean
}

export type HeartRateSummary = {
  average: number
  minimum: number
  maximum: number
}

export type ActivityTrackSummary = {
  startedAt: Date
  elapsedSeconds: number
  movingSeconds: number
  distanceMeters: number
  /** `device` when the watch recorded distance itself, which beats integrating GPS fixes. */
  distanceSource: 'device' | 'computed'
  averagePaceSecondsPerKm: number
  elevationGainMeters: number
  elevationLossMeters: number
  splits: TrackSplit[]
  heartRate?: HeartRateSummary
  route: RoutePoint[]
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineMeters(from: RoutePoint, to: RoutePoint): number {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLon = toRadians(to.lon - from.lon)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)))
}

function hasPosition(point: TrackPoint): point is TrackPoint & RoutePoint {
  return point.lat !== undefined && point.lon !== undefined
}

/**
 * Device distance wins when it is present and monotonic. A reset partway through
 * means the export stitched laps together badly, and integrating the fixes is safer.
 */
function cumulativeDistances(points: TrackPoint[]): {
  cumulative: number[]
  source: 'device' | 'computed'
} {
  const deviceValues = points.map((point) => point.deviceDistance)
  const usable =
    deviceValues.every((value) => value !== undefined) &&
    deviceValues.every((value, index) => index === 0 || value! >= deviceValues[index - 1]!)

  if (usable) {
    const base = deviceValues[0]!
    return { cumulative: deviceValues.map((value) => value! - base), source: 'device' }
  }

  const cumulative: number[] = [0]
  let previous: (TrackPoint & RoutePoint) | null = hasPosition(points[0]) ? points[0] : null
  for (let index = 1; index < points.length; index++) {
    const point = points[index]
    if (hasPosition(point) && previous) {
      cumulative.push(cumulative[index - 1] + haversineMeters(previous, point))
      previous = point
    } else {
      cumulative.push(cumulative[index - 1])
      if (hasPosition(point)) previous = point
    }
  }
  return { cumulative, source: 'computed' }
}

/** Hysteresis: a move only counts once it clears the noise floor from the last accepted level. */
function elevationChange(points: TrackPoint[]): { gain: number; loss: number } {
  let reference: number | undefined
  let gain = 0
  let loss = 0

  for (const point of points) {
    if (point.elevation === undefined) continue
    if (reference === undefined) {
      reference = point.elevation
      continue
    }
    const delta = point.elevation - reference
    if (delta >= ELEVATION_NOISE_THRESHOLD_METERS) {
      gain += delta
      reference = point.elevation
    } else if (delta <= -ELEVATION_NOISE_THRESHOLD_METERS) {
      loss -= delta
      reference = point.elevation
    }
  }

  return { gain, loss }
}

function movingSeconds(points: TrackPoint[], cumulative: number[]): number {
  let moving = 0
  for (let index = 1; index < points.length; index++) {
    const seconds = (points[index].time - points[index - 1].time) / 1000
    if (seconds <= 0) continue
    const metres = cumulative[index] - cumulative[index - 1]
    if (metres / seconds >= MOVING_SPEED_THRESHOLD_MPS) moving += seconds
  }
  return moving
}

/** Linear interpolation, so a split boundary is not rounded to the nearest fix. */
function timeAtDistance(
  points: TrackPoint[],
  cumulative: number[],
  index: number,
  target: number,
): number {
  const spanned = cumulative[index] - cumulative[index - 1]
  if (spanned <= 0) return points[index].time
  const ratio = (target - cumulative[index - 1]) / spanned
  return points[index - 1].time + ratio * (points[index].time - points[index - 1].time)
}

function averageHeartRate(points: TrackPoint[], from: number, to: number): number | undefined {
  let sum = 0
  let count = 0
  for (let index = from; index <= to && index < points.length; index++) {
    const rate = points[index].heartRate
    if (rate !== undefined && rate > 0) {
      sum += rate
      count++
    }
  }
  return count > 0 ? Math.round(sum / count) : undefined
}

function buildSplits(points: TrackPoint[], cumulative: number[]): TrackSplit[] {
  const splits: TrackSplit[] = []
  const total = cumulative[cumulative.length - 1]

  let boundary = SPLIT_DISTANCE_METERS
  let previousTime = points[0].time
  let previousIndex = 0

  for (let index = 1; index < points.length; index++) {
    while (cumulative[index] >= boundary) {
      const crossedAt = timeAtDistance(points, cumulative, index, boundary)
      const durationSeconds = (crossedAt - previousTime) / 1000
      const rate = averageHeartRate(points, previousIndex, index)
      splits.push({
        index: splits.length + 1,
        distanceMeters: SPLIT_DISTANCE_METERS,
        durationSeconds,
        paceSecondsPerKm: durationSeconds,
        ...(rate !== undefined ? { averageHeartRate: rate } : {}),
        partial: false,
      })
      previousTime = crossedAt
      previousIndex = index
      boundary += SPLIT_DISTANCE_METERS
    }
  }

  const remaining = total - (boundary - SPLIT_DISTANCE_METERS)
  if (remaining > 0) {
    const durationSeconds = (points[points.length - 1].time - previousTime) / 1000
    const rate = averageHeartRate(points, previousIndex, points.length - 1)
    splits.push({
      index: splits.length + 1,
      distanceMeters: remaining,
      durationSeconds,
      paceSecondsPerKm: (durationSeconds / remaining) * SPLIT_DISTANCE_METERS,
      ...(rate !== undefined ? { averageHeartRate: rate } : {}),
      partial: true,
    })
  }

  return splits
}

function heartRateSummary(points: TrackPoint[]): HeartRateSummary | undefined {
  const readings = points
    .map((point) => point.heartRate)
    .filter((rate): rate is number => rate !== undefined && rate > 0)

  if (readings.length === 0) return undefined

  return {
    average: Math.round(readings.reduce((sum, rate) => sum + rate, 0) / readings.length),
    minimum: Math.min(...readings),
    maximum: Math.max(...readings),
  }
}

export function summarizeActivity(activity: ParsedActivity): ActivityTrackSummary {
  const { points } = activity
  const { cumulative, source } = cumulativeDistances(points)
  const distanceMeters = cumulative[cumulative.length - 1]
  const elapsedSeconds = (points[points.length - 1].time - points[0].time) / 1000
  const { gain, loss } = elevationChange(points)
  const heartRate = heartRateSummary(points)

  return {
    startedAt: activity.startedAt,
    elapsedSeconds,
    movingSeconds: movingSeconds(points, cumulative),
    distanceMeters,
    distanceSource: source,
    averagePaceSecondsPerKm:
      distanceMeters > 0 ? (elapsedSeconds / distanceMeters) * SPLIT_DISTANCE_METERS : 0,
    elevationGainMeters: Math.round(gain),
    elevationLossMeters: Math.round(loss),
    splits: buildSplits(points, cumulative),
    ...(heartRate ? { heartRate } : {}),
    route: simplifyRoute(
      points.filter(hasPosition).map((point) => ({ lat: point.lat, lon: point.lon })),
      ROUTE_POINT_BUDGET,
    ),
  }
}
