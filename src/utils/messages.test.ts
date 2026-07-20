import { describe, expect, it } from 'vitest'
import {
  getFaltouMessage,
  getResultsSavedMessage,
  getSarcasticClassification,
} from './messages'

describe('messages', () => {
  it('returns non-empty results saved message', () => {
    expect(getResultsSavedMessage('Zé Ninguém', '5:06')).toContain('VAMOS')
  })

  it('returns faltou message with name', () => {
    expect(getFaltouMessage('ParkRun', 'Zé Ninguém')).toContain('Zé')
    expect(getFaltouMessage('ParkRun', 'Zé Ninguém')).toContain('ParkRun')
  })

  it('uses sarcasm only for poor classification', () => {
    expect(getSarcasticClassification(10, 100)).toBeNull()
    expect(getSarcasticClassification(80, 100)).not.toBeNull()
  })
})
