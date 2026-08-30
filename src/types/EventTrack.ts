import type {
  ActivityFileFormat,
  HeartRateSummary,
  RoutePoint,
  TrackProfilePoint,
  TrackSplit,
} from '../domain/activityTrack'

/**
 * One track per event, so the document id is fixed. A race has a single file, and
 * a fixed id makes replacing it a write to the same place instead of a cleanup.
 */
export const EVENT_TRACK_DOC_ID = 'current'

/**
 * The derived summary of an uploaded GPX or TCX, stored in its own subcollection
 * rather than on the event: the route alone is several kilobytes, and every event
 * list query would otherwise carry it.
 */
export type EventTrack = {
  id: string
  eventId: string
  userId: string
  format: ActivityFileFormat
  storagePath: string
  downloadUrl: string
  sizeBytes: number
  fileName: string
  startedAt: Date
  elapsedSeconds: number
  movingSeconds: number
  distanceMeters: number
  distanceSource: 'device' | 'computed'
  averagePaceSecondsPerKm: number
  /** Approximate, and not comparable across formats. See the parser notes. */
  elevationGainMeters: number
  elevationLossMeters: number
  splits: TrackSplit[]
  heartRate?: HeartRateSummary
  route: RoutePoint[]
  /** Evenly spaced samples for the pace and elevation chart. */
  profile: TrackProfilePoint[]
  createdAt: Date
}

export type EventTrackCreate = Omit<EventTrack, 'id' | 'eventId' | 'createdAt'>
