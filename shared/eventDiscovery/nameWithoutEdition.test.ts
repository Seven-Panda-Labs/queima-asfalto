import { describe, expect, it } from 'vitest'
import { nameWithoutEdition } from './identity'

const NOW = new Date('2026-09-13T00:00:00Z')

describe('nameWithoutEdition', () => {
  it('drops the ordinal that says which running this is', () => {
    // 575 of the catalog's 698 names carry one of these.
    expect(nameWithoutEdition('33. Graz Marathon', NOW)).toBe('Graz Marathon')
    expect(nameWithoutEdition('39. Dagersheimer Waldlauf', NOW)).toBe('Dagersheimer Waldlauf')
    expect(nameWithoutEdition('4. Lauf der Bildung Aschersleben', NOW)).toBe(
      'Lauf der Bildung Aschersleben',
    )
    expect(nameWithoutEdition('IX. Meia de Aveiro', NOW)).toBe('Meia de Aveiro')
  })

  it('keeps a number that is the race rather than its edition', () => {
    // No dot, and in almost every one of these the number is the name.
    expect(nameWithoutEdition('10 Marathon in 10 Tagen', NOW)).toBe('10 Marathon in 10 Tagen')
    expect(nameWithoutEdition('20 Km de la Forêt de Beloeil', NOW)).toBe(
      '20 Km de la Forêt de Beloeil',
    )
    expect(nameWithoutEdition('24 Stunden Jubiläumslauf HaWei24', NOW)).toBe(
      '24 Stunden Jubiläumslauf HaWei24',
    )
  })

  it('drops a year at the end when it is the edition', () => {
    expect(nameWithoutEdition('Hermannslauf 2027', NOW)).toBe('Hermannslauf')
    expect(nameWithoutEdition('Bonner Nikolauslauf 2026', NOW)).toBe('Bonner Nikolauslauf')
  })

  it('keeps a year that is part of what the race is called', () => {
    // Named after the disaster it remembers, and no calendar publishes 1965.
    expect(nameWithoutEdition('Mattmark Memorial 1965', NOW)).toBe('Mattmark Memorial 1965')
    expect(nameWithoutEdition('Berlin 2036 Challenge', NOW)).toBe('Berlin 2036 Challenge')
  })

  it('leaves a name that is only an edition alone', () => {
    expect(nameWithoutEdition('2027', NOW)).toBe('2027')
    expect(nameWithoutEdition('10.', NOW)).toBe('10.')
  })

  it('does both when a name carries both', () => {
    expect(nameWithoutEdition('12. Hermannslauf 2027', NOW)).toBe('Hermannslauf')
  })
})
