import { describe, expect, it } from 'vitest'
import { MAX_TRACK_BYTES } from '../constants/activityTrack'
import { validateTrackFile } from './trackValidation'

function fileOf(name: string, size = 1024): File {
  const file = new File(['<gpx></gpx>'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateTrackFile', () => {
  it('accepts the uppercase extensions watch exports actually use', () => {
    expect(validateTrackFile(fileOf('run.GPX'))).toEqual({ ok: true, extension: 'gpx' })
    expect(validateTrackFile(fileOf('run.TCX'))).toEqual({ ok: true, extension: 'tcx' })
  })

  it('ignores the MIME type, which is unreliable for these files', () => {
    const file = new File(['<gpx></gpx>'], 'run.gpx', { type: 'application/octet-stream' })
    expect(validateTrackFile(file).ok).toBe(true)
  })

  it('rejects other formats', () => {
    expect(validateTrackFile(fileOf('run.fit'))).toEqual({ ok: false, code: 'unsupported_type' })
    expect(validateTrackFile(fileOf('run.jpg'))).toEqual({ ok: false, code: 'unsupported_type' })
  })

  it('rejects an empty file', () => {
    expect(validateTrackFile(fileOf('run.gpx', 0))).toEqual({
      ok: false,
      code: 'unsupported_type',
    })
  })

  it('rejects a file over the size limit', () => {
    expect(validateTrackFile(fileOf('run.tcx', MAX_TRACK_BYTES + 1))).toEqual({
      ok: false,
      code: 'file_too_large',
    })
    expect(validateTrackFile(fileOf('run.tcx', MAX_TRACK_BYTES)).ok).toBe(true)
  })
})
