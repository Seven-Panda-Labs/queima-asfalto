import { describe, expect, it } from 'vitest'
import { formatDatePt } from './date'

describe('a date nothing can read', () => {
  it('renders as a dash instead of throwing', () => {
    // `Intl` throws RangeError on an invalid date, and the shared catalog held
    // "2026-08.-23": every page that showed that race went white.
    expect(formatDatePt(new Date('2026-08.-23'))).toBe('-')
    expect(formatDatePt(new Date(Number.NaN))).toBe('-')
  })

  it('still formats a real one', () => {
    expect(formatDatePt(new Date('2026-08-23T09:00:00Z'))).toBe('23/08/2026')
  })
})
