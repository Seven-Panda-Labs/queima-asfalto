import { describe, expect, it } from 'vitest'
import {
  formatParkrunnerId,
  isCompleteParkrunnerId,
  parseParkrunnerIdDigits,
  parkrunnerIdForUrl,
} from './parkrunnerId'

describe('parkrunnerId', () => {
  it('parses digits with or without A prefix', () => {
    expect(parseParkrunnerIdDigits('A490')).toBe('490')
    expect(parseParkrunnerIdDigits('490')).toBe('490')
    expect(parseParkrunnerIdDigits('A10abc78662')).toBe('1078662')
  })

  it('formats with A prefix', () => {
    expect(formatParkrunnerId('1078662')).toBe('A1078662')
    expect(formatParkrunnerId('490')).toBe('A490')
    expect(formatParkrunnerId('')).toBe('')
  })

  it('validates complete ids', () => {
    expect(isCompleteParkrunnerId('A1078662')).toBe(true)
    expect(isCompleteParkrunnerId('A490')).toBe(false)
    expect(isCompleteParkrunnerId('650543')).toBe(false)
  })

  it('strips prefix for profile URLs', () => {
    expect(parkrunnerIdForUrl('A490')).toBe('490')
    expect(parkrunnerIdForUrl('A1078662')).toBe('1078662')
  })
})
