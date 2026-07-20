import { describe, expect, it } from 'vitest'
import { pickRandomLine } from './pickVoiceLine'

describe('pickRandomLine', () => {
  it('returns empty string for empty pool', () => {
    expect(pickRandomLine([])).toBe('')
  })

  it('returns the only line', () => {
    expect(pickRandomLine(['Só uma'])).toBe('Só uma')
  })

  it('picks deterministically with seed', () => {
    const lines = ['a', 'b', 'c']
    expect(pickRandomLine(lines, 0)).toBe('a')
    expect(pickRandomLine(lines, 1)).toBe('b')
    expect(pickRandomLine(lines, 3)).toBe('a')
  })
})
