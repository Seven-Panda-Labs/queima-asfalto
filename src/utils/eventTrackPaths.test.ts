import { describe, expect, it } from 'vitest'
import { buildEventTrackStoragePath } from './eventTrackPaths'

describe('buildEventTrackStoragePath', () => {
  it('places the file under the owner, the event and the fixed track id', () => {
    expect(buildEventTrackStoragePath('user-1', 'event-1', 'current', 'gpx')).toBe(
      'users/user-1/events/event-1/track/current.gpx',
    )
  })

  it('carries the format as the extension, which is what the rules check', () => {
    expect(buildEventTrackStoragePath('user-1', 'event-1', 'current', 'tcx')).toMatch(
      /\.tcx$/,
    )
  })
})
