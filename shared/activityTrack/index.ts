export { parseActivityFile, parseActivityXml, trackExtensionOf } from './parseActivityFile.js'
export { haversineMeters, summarizeActivity } from './metrics.js'
export { computePacingDrift } from './pacing.js'
export { simplifyRoute } from './simplify.js'
export type {
  ActivityTrackSummary,
  HeartRateSummary,
  TrackProfilePoint,
  TrackSplit,
} from './metrics.js'
export type { RoutePoint } from './simplify.js'
export type {
  ActivityFileErrorCode,
  ActivityFileFormat,
  ParseActivityResult,
  ParsedActivity,
  TrackLap,
  TrackPoint,
} from './types.js'
