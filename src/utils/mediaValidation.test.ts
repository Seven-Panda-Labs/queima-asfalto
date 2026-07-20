import { describe, expect, it } from 'vitest'
import {
  detectMediaType,
  resolveMediaType,
  validateMediaBatch,
  validateMediaFile,
} from './mediaValidation'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('mediaValidation', () => {
  it('detects photo and video mime types', () => {
    expect(detectMediaType('image/jpeg')).toBe('photo')
    expect(detectMediaType('video/mp4')).toBe('video')
    expect(detectMediaType('application/pdf')).toBeNull()
  })

  it('detects mp4 by extension when mime type is missing', () => {
    const file = makeFile('download.mp4', '', 1024)
    expect(resolveMediaType(file)).toBe('video')
    expect(validateMediaFile(file, { currentCount: 0 })).toEqual({ ok: true, type: 'video' })
  })

  it('detects mp4 by extension with generic octet-stream mime', () => {
    const file = makeFile('race.mp4', 'application/octet-stream', 1024)
    expect(resolveMediaType(file)).toBe('video')
  })

  it('rejects unsupported files', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    expect(validateMediaFile(file, { currentCount: 0 })).toEqual({
      ok: false,
      code: 'unsupported_type',
    })
  })

  it('rejects photos above 5 MB', () => {
    const file = makeFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
    expect(validateMediaFile(file, { currentCount: 0 })).toEqual({
      ok: false,
      code: 'photo_too_large',
    })
  })

  it('rejects videos above 100 MB', () => {
    const file = makeFile('big.mp4', 'video/mp4', 100 * 1024 * 1024 + 1)
    expect(validateMediaFile(file, { currentCount: 0 })).toEqual({
      ok: false,
      code: 'video_too_large',
    })
  })

  it('limits total files per event in batch validation', () => {
    const files = [
      makeFile('a.jpg', 'image/jpeg', 1024),
      makeFile('b.jpg', 'image/jpeg', 1024),
    ]
    const result = validateMediaBatch(files, 9)
    expect(result.accepted).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.code).toBe('limit_reached')
  })
})
