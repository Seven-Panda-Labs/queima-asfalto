import type { EventTrack } from '../types/EventTrack'
import { normalizeTime, parseTime } from './time'

/**
 * What the editor should do with a track's measured time.
 *
 * `differs` never resolves itself. A watch and an official timing mat rarely
 * agree to the second, and the official result is the one that counts, so a
 * value already on the event is only ever replaced by an explicit choice.
 */
export type TrackTimeSuggestion =
  | { state: 'empty'; suggestedTime: string }
  | { state: 'matches'; suggestedTime: string }
  | {
      state: 'differs'
      suggestedTime: string
      currentTime: string
      /** Positive when the track is slower than the time already recorded. */
      deltaSeconds: number
    }

export function formatSecondsAsTime(totalSeconds: number): string {
  const rounded = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function buildTrackTimeSuggestion(
  track: Pick<EventTrack, 'elapsedSeconds'>,
  currentTime: string | undefined,
): TrackTimeSuggestion {
  const suggestedTime = formatSecondsAsTime(track.elapsedSeconds)

  const normalized = currentTime ? normalizeTime(currentTime) : null
  if (!normalized) return { state: 'empty', suggestedTime }

  const currentSeconds = parseTime(normalized)
  const suggestedSeconds = parseTime(suggestedTime)
  if (currentSeconds === null || suggestedSeconds === null) {
    return { state: 'empty', suggestedTime }
  }

  if (currentSeconds === suggestedSeconds) return { state: 'matches', suggestedTime }

  return {
    state: 'differs',
    suggestedTime,
    currentTime: normalized,
    deltaSeconds: suggestedSeconds - currentSeconds,
  }
}

/**
 * How far the measured distance is from the official one, as a percentage.
 *
 * A GPS track of a certified course is normally within about one percent. A much
 * larger figure means the file does not match the event, or the course was cut.
 */
export function distanceDeviationPercent(
  track: Pick<EventTrack, 'distanceMeters'>,
  officialDistanceKm: number,
): number | null {
  if (!Number.isFinite(officialDistanceKm) || officialDistanceKm <= 0) return null
  const officialMeters = officialDistanceKm * 1000
  return ((track.distanceMeters - officialMeters) / officialMeters) * 100
}
