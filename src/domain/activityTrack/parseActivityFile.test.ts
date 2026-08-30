import { describe, expect, it } from 'vitest'
import gpxSample from '../../../assets/sample-parkrun.GPX?raw'
import tcxSample from '../../../assets/sample-parkrun.TCX?raw'
import { parseActivityXml, trackExtensionOf } from './parseActivityFile'

describe('trackExtensionOf', () => {
  it('accepts the uppercase names the sample exports use', () => {
    expect(trackExtensionOf('sample-parkrun.GPX')).toBe('gpx')
    expect(trackExtensionOf('sample-parkrun.TCX')).toBe('tcx')
    expect(trackExtensionOf('run.gpx')).toBe('gpx')
  })

  it('rejects anything else', () => {
    expect(trackExtensionOf('run.fit')).toBeNull()
    expect(trackExtensionOf('run')).toBeNull()
    expect(trackExtensionOf('')).toBeNull()
  })
})

describe('parseActivityXml', () => {
  it('detects the format from the root element, not the file name', () => {
    const gpx = parseActivityXml(gpxSample)
    const tcx = parseActivityXml(tcxSample)
    expect(gpx.ok && gpx.activity.format).toBe('gpx')
    expect(tcx.ok && tcx.activity.format).toBe('tcx')
  })

  it('reports malformed XML instead of throwing', () => {
    expect(parseActivityXml('<gpx><trk>')).toEqual({ ok: false, code: 'malformed_xml' })
  })

  it('rejects XML that is neither GPX nor TCX', () => {
    expect(parseActivityXml('<kml></kml>')).toEqual({ ok: false, code: 'unsupported_type' })
  })

  it('reads a GPX that declares no namespace at all', () => {
    // Not every exporter writes xmlns, and the lookups must not depend on it.
    const result = parseActivityXml(
      '<gpx><trk><trkseg>' +
        '<trkpt lat="52.1" lon="13.1"><ele>40</ele><time>2026-08-29T07:00:00Z</time></trkpt>' +
        '<trkpt lat="52.2" lon="13.2"><ele>41</ele><time>2026-08-29T07:00:01Z</time></trkpt>' +
        '</trkseg></trk></gpx>',
    )
    expect(result.ok && result.activity.points).toHaveLength(2)
  })

  it('reads a GPX written with a namespace prefix', () => {
    const result = parseActivityXml(
      '<g:gpx xmlns:g="http://www.topografix.com/GPX/1/1"><g:trk><g:trkseg>' +
        '<g:trkpt lat="52.1" lon="13.1"><g:time>2026-08-29T07:00:00Z</g:time></g:trkpt>' +
        '</g:trkseg></g:trk></g:gpx>',
    )
    expect(result.ok && result.activity.points).toHaveLength(1)
  })

  it('skips trackpoints with no timestamp, since every metric is time based', () => {
    const result = parseActivityXml(
      '<gpx><trk><trkseg>' +
        '<trkpt lat="52.1" lon="13.1"><ele>40</ele></trkpt>' +
        '<trkpt lat="52.2" lon="13.2"><time>2026-08-29T07:00:01Z</time></trkpt>' +
        '</trkseg></trk></gpx>',
    )
    expect(result.ok && result.activity.points).toHaveLength(1)
  })

  it('rejects a well formed file with no usable points', () => {
    expect(parseActivityXml('<gpx><trk><trkseg></trkseg></trk></gpx>')).toEqual({
      ok: false,
      code: 'no_track_points',
    })
  })
})

describe('GPX parsing', () => {
  const result = parseActivityXml(gpxSample)
  if (!result.ok) throw new Error('sample GPX must parse')
  const { activity } = result

  it('reads every trackpoint', () => {
    expect(activity.points).toHaveLength(1581)
  })

  it('starts at the first trackpoint, not at the export time in the metadata', () => {
    // The file was exported on the 30th; the run happened on the 29th.
    expect(activity.startedAt.toISOString()).toBe('2026-08-29T07:03:42.086Z')
  })

  it('carries position and elevation but no sensor data', () => {
    const first = activity.points[0]
    expect(first.lat).toBeCloseTo(52.34235667, 6)
    expect(first.lon).toBeCloseTo(12.99992, 6)
    expect(first.elevation).toBe(40)
    expect(first.heartRate).toBeUndefined()
    expect(first.deviceDistance).toBeUndefined()
  })

  it('has no laps to report', () => {
    expect(activity.laps).toEqual([])
  })
})

describe('TCX parsing', () => {
  const result = parseActivityXml(tcxSample)
  if (!result.ok) throw new Error('sample TCX must parse')
  const { activity } = result

  it('reads every trackpoint and the sport', () => {
    expect(activity.points).toHaveLength(1581)
    expect(activity.sport).toBe('Running')
  })

  it('reads sensor data alongside position', () => {
    const first = activity.points[0]
    expect(first.lat).toBeCloseTo(52.34235667, 6)
    expect(first.elevation).toBeCloseTo(23.775, 3)
    expect(first.deviceDistance).toBeCloseTo(0.5, 3)
    expect(first.heartRate).toBe(72)
  })

  it('reads the auto laps the watch recorded', () => {
    expect(activity.laps).toHaveLength(5)
    expect(activity.laps[0].durationSeconds).toBe(310)
    expect(activity.laps[0].distanceMeters).toBe(1000)
    expect(activity.laps[0].averageHeartRate).toBe(141)
    expect(activity.laps[0].maximumHeartRate).toBe(179)
    expect(activity.laps[4].distanceMeters).toBe(935.5)
  })

  it('does not read a lap time from the trackpoints nested inside it', () => {
    // A descendant lookup for Time inside a Lap would find the first trackpoint.
    expect(activity.laps[1].startTime).toBe(Date.parse('2026-08-29T07:08:49.055Z'))
  })

  it('treats a zero calorie aggregate as absent', () => {
    expect(activity.laps[0].calories).toBe(262)
    expect(activity.laps[1].calories).toBeUndefined()
  })
})
