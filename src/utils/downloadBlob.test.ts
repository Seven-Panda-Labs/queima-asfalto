import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './downloadBlob'

describe('downloadBlob', () => {
  const createObjectURL = vi.fn(() => 'blob:queima-asfalto/backup')
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    // jsdom implements neither of these.
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clicks a download anchor carrying the filename', () => {
    const clicked: HTMLAnchorElement[] = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push(this)
      })

    downloadBlob(new Blob(['payload'], { type: 'application/zip' }), 'backup.zip')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clicked).toHaveLength(1)
    expect(clicked[0].download).toBe('backup.zip')
    expect(clicked[0].getAttribute('href')).toBe('blob:queima-asfalto/backup')

    clickSpy.mockRestore()
  })

  it('removes the anchor and revokes the object url', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadBlob(new Blob(['payload']), 'backup.zip')

    expect(document.querySelector('a')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:queima-asfalto/backup')

    clickSpy.mockRestore()
  })
})
