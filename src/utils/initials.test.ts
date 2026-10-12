import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('takes the first and last word of a name', () => {
    expect(initials('Zé Maria Ninguém')).toBe('ZN')
    expect(initials('zé ninguém')).toBe('ZN')
  })

  it('reads an email local part when there is no name', () => {
    expect(initials('ze.ninguem@example.com')).toBe('ZN')
    expect(initials('zeninguem@example.com')).toBe('Z')
  })

  it('keeps a single word to one letter', () => {
    expect(initials('Zé')).toBe('Z')
  })

  it('falls back when there is nothing to read', () => {
    expect(initials('  ')).toBe('?')
  })
})
