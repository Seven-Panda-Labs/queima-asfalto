import { describe, expect, it } from 'vitest'
import { useOnlineStatus } from './useOnlineStatus'

describe('useOnlineStatus', () => {
  it('exports hook function', () => {
    expect(typeof useOnlineStatus).toBe('function')
  })
})
