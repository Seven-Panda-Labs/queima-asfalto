export type ActivityFileFormat = 'gpx' | 'tcx'

export type TrackPoint = {
  /** Milliseconds since the epoch. */
  time: number
  lat?: number
  lon?: number
  /**
   * Metres. Only differences are meaningful: GPX and TCX exports of the same run
   * disagree on the absolute value, and by more than a constant offset.
   */
  elevation?: number
  /** Metres from the start as the device measured them. TCX only. */
  deviceDistance?: number
  heartRate?: number
  /**
   * As recorded, with no unit conversion. Devices disagree on whether this counts
   * both legs or one, so nothing derives from it until that is settled per device.
   */
  cadenceRpm?: number
}

/** A lap the device recorded, kept as it came so nothing is recomputed twice. */
export type TrackLap = {
  startTime: number
  durationSeconds: number
  distanceMeters: number
  averageHeartRate?: number
  maximumHeartRate?: number
  calories?: number
}

export type ParsedActivity = {
  format: ActivityFileFormat
  /**
   * Taken from the first trackpoint. The GPX `<metadata><time>` is when the file was
   * exported, which in the sample is a day after the run.
   */
  startedAt: Date
  /** TCX only, e.g. `Running`. */
  sport?: string
  points: TrackPoint[]
  laps: TrackLap[]
}

export type ActivityFileErrorCode =
  | 'unsupported_type'
  | 'file_too_large'
  | 'malformed_xml'
  | 'no_track_points'

export type ParseActivityResult =
  | { ok: true; activity: ParsedActivity }
  | { ok: false; code: ActivityFileErrorCode }
