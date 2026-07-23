import { describe, expect, it } from 'vitest'
import { stepMediaIndex, swipeDirection } from './eventMediaLightbox'

describe('stepMediaIndex', () => {
  it('steps within bounds', () => {
    expect(stepMediaIndex(1, -1, 3)).toBe(0)
    expect(stepMediaIndex(1, 1, 3)).toBe(2)
  })

  it('clamps at the first and last item', () => {
    expect(stepMediaIndex(0, -1, 3)).toBe(0)
    expect(stepMediaIndex(2, 1, 3)).toBe(2)
  })

  it('returns 0 for empty galleries', () => {
    expect(stepMediaIndex(0, 1, 0)).toBe(0)
  })
})

describe('swipeDirection', () => {
  it('detects horizontal swipes past the threshold', () => {
    expect(swipeDirection(180, 100, 100, 105)).toBe('next')
    expect(swipeDirection(100, 100, 180, 105)).toBe('previous')
  })

  it('ignores short or mostly vertical gestures', () => {
    expect(swipeDirection(100, 100, 130, 100)).toBeNull()
    expect(swipeDirection(100, 100, 180, 220)).toBeNull()
  })
})
