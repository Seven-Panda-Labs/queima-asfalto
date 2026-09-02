import { describe, expect, it } from 'vitest'
import { nearestEventType, parseDistancesKm, toDisciplines } from './distances'

describe('parseDistancesKm', () => {
  it('reads the offer names an organiser actually writes', () => {
    expect(
      parseDistancesKm(['Trail Longo 17km', 'Trail Curto 10km', 'Caminhada 8km']),
    ).toEqual([8, 10, 17])
  })

  it('reads a comma decimal and a spaced unit', () => {
    expect(parseDistancesKm(['Meia maratona 21,1 km'])).toEqual([21.1])
  })

  it('reads metres when the number is big enough to be metres', () => {
    expect(parseDistancesKm(['3000 m'])).toEqual([3])
    // A thousands separator read as a decimal point lands on 10 either way.
    expect(parseDistancesKm(['10.000 m'])).toEqual([10])
    // No race is five metres long, so a small number with a bare "m" is read
    // as the kilometres the organiser meant.
    expect(parseDistancesKm(['5 m'])).toEqual([5])
  })

  it('reads miles', () => {
    expect(parseDistancesKm(['10 miles'])[0]).toBeCloseTo(16.093, 2)
  })

  it('deduplicates and sorts', () => {
    expect(parseDistancesKm(['10km', '10 km', '5km'])).toEqual([5, 10])
  })

  it('throws out what cannot be a race distance', () => {
    expect(parseDistancesKm(['Dorsal 300', 'Estágio de 900km'])).toEqual([])
  })

  it('has nothing to say about an offer with no distance in it', () => {
    expect(parseDistancesKm(['Inscrição solidária'])).toEqual([])
  })
})

describe('nearestEventType', () => {
  it('files a real distance under the preset it belongs to', () => {
    expect(nearestEventType(42.195)).toBe('km_42_2')
    expect(nearestEventType(21.0975)).toBe('km_21_1')
    expect(nearestEventType(10)).toBe('km_10')
    expect(nearestEventType(8)).toBe('km_10')
    // Nearest is nearest: 17 km sits closer to ten miles than to 15 km.
    expect(nearestEventType(17)).toBe('mi_10')
  })

  it('files by ratio, so the short distances do not swallow everything', () => {
    expect(nearestEventType(1.5)).toBe('m_1500')
    expect(nearestEventType(31)).toBe('km_30')
    expect(nearestEventType(120)).toBe('km_100')
  })
})

describe('toDisciplines', () => {
  it('maps a multi distance event onto presets, in catalog order', () => {
    expect(toDisciplines([8, 10, 17])).toEqual(['km_10', 'mi_10'])
  })

  it('has nothing to map with no distances', () => {
    expect(toDisciplines([])).toEqual([])
  })
})
