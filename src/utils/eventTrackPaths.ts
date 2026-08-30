import type { ActivityFileFormat } from '../domain/activityTrack'

/**
 * Kept out of the Storage service so it can be tested without initialising
 * Firebase, and so the Firestore rule and the client agree on one definition.
 */
export function buildEventTrackStoragePath(
  userId: string,
  eventId: string,
  trackId: string,
  format: ActivityFileFormat,
): string {
  return `users/${userId}/events/${eventId}/track/${trackId}.${format}`
}
