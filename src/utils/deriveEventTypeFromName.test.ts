import { describe, expect, it } from 'vitest'
import { deriveEventTypeFromName } from './deriveEventTypeFromName'

describe('deriveEventTypeFromName', () => {
  it('detecta maratona completa', () => {
    expect(deriveEventTypeFromName('Spitsbergen Marathon')).toEqual({
      eventType: 'km_42_2',
      realDistance: 42.2,
    })
    expect(deriveEventTypeFromName('Egyptian Marathon')).toEqual({
      eventType: 'km_42_2',
      realDistance: 42.2,
    })
  })

  it('detecta meia maratona', () => {
    expect(deriveEventTypeFromName('Meia Maratona do Algarve')).toEqual({
      eventType: 'km_21_1',
      realDistance: 21.1,
    })
    expect(deriveEventTypeFromName('Meia Maratona de Faro')).toEqual({
      eventType: 'km_21_1',
      realDistance: 21.1,
    })
  })

  it('detecta provas por millas', () => {
    const result = deriveEventTypeFromName('X Millas del Guadiana')
    expect(result.eventType).toBe('km_21_1')
    expect(result.realDistance).toBeCloseTo(16.1, 0)
  })

  it('detecta Göteborgsvarvet como meia', () => {
    expect(deriveEventTypeFromName('Göteborgsvarvet')).toEqual({
      eventType: 'km_21_1',
      realDistance: 21.1,
    })
  })

  it('fallback para nome desconhecido', () => {
    expect(deriveEventTypeFromName('')).toEqual({
      eventType: 'km_10',
      realDistance: 10,
    })
  })
})
