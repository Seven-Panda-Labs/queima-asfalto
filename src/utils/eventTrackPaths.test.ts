import { describe, expect, it } from 'vitest'
import { buildEventTrackStoragePath, eventTrackContentType } from './eventTrackPaths'

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

describe('eventTrackContentType', () => {
  it('stores the XML formats as XML and FIT as the binary it is', () => {
    expect(eventTrackContentType('gpx')).toBe('application/xml')
    expect(eventTrackContentType('tcx')).toBe('application/xml')
    expect(eventTrackContentType('fit')).toBe('application/octet-stream')
  })
})
