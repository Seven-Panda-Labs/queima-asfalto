import { describe, expect, it } from 'vitest'
import {
  isChildrensRace,
  nearestEventType,
  parseDistancesKm,
  toDisciplines,
} from './distances'

describe('parseDistancesKm', () => {
  it('reads the offer names an organiser actually writes', () => {
    expect(
      parseDistancesKm(['Trail Longo 17km', 'Trail Curto 10km', 'Caminhada 8km']),
    ).toEqual([8, 10, 17])
  })

  it('reads a comma decimal and a spaced unit', () => {
    expect(parseDistancesKm(['Meia maratona 21,1 km'])).toEqual([21.1])
  })

  it('reads metres as metres', () => {
    expect(parseDistancesKm(['3000 m', 'Corrida 4000m'])).toEqual([3, 4])
    // In metres, three digits after the separator is a thousands separator.
    expect(parseDistancesKm(['10.000 m'])).toEqual([10])
  })

  it('throws out the children s races an event sells beside the race', () => {
    // Straight from acorrer: one event sells a 10K and five youth races. The
    // 1000 m one used to survive on its number alone.
    expect(
      parseDistancesKm([
        'Corrida 10km',
        'Caminhada 5km',
        'Corrida Jovem 1000m',
        'Corrida Jovem 200m',
        'Corrida Jovem 100m',
      ]),
    ).toEqual([5, 10])
  })

  it('reads a distance an organiser names instead of measuring', () => {
    // Straight from davengo's starter list and the scc calendar.
    expect(parseDistancesKm(['Halbmarathon'])).toEqual([21.0975])
    expect(parseDistancesKm(['Media Maraton de Bogota'])).toEqual([21.0975])
    expect(parseDistancesKm(['21. swb-Marathon Bremen 2026'])).toEqual([42.195])
    // A number beats the word it sits next to.
    expect(parseDistancesKm(['Viertelmarathon (ca 10,5 km)'])).toEqual([10.5])
  })

  it('does not read a half marathon as a marathon', () => {
    expect(parseDistancesKm(['Halbmarathon'])).not.toContain(42.195)
    expect(parseDistancesKm(['Meia Maratona de Lisboa'])).toEqual([21.0975])
  })

  it('leaves a children s race out however it is written', () => {
    expect(parseDistancesKm(['Kinderlauf 2km'])).toEqual([])
    expect(parseDistancesKm(['Bambini 800m'])).toEqual([])
    expect(parseDistancesKm(['mini-MARATHON 4,2195 km'])).toEqual([])
    expect(parseDistancesKm(['Kids Run 1 km'])).toEqual([])
  })

  it('keeps the decimals of a distance written in kilometres', () => {
    expect(parseDistancesKm(['Maratona 42,195 km'])).toEqual([42.195])
    // Four decimals, which is how the scc calendar writes a half marathon.
    expect(parseDistancesKm(['21,0975 km'])).toEqual([21.0975])
    expect(parseDistancesKm(['4,2195 km'])).toEqual([4.2195])
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

describe('isChildrensRace', () => {
  it('recognises the words organisers use for them', () => {
    expect(isChildrensRace('Kinderlauf')).toBe(true)
    expect(isChildrensRace('Corrida Jovem 1000m')).toBe(true)
    expect(isChildrensRace('junior parkrun')).toBe(true)
  })

  it('leaves an adult race alone', () => {
    expect(isChildrensRace('Halbmarathon')).toBe(false)
    expect(isChildrensRace('Maratona de Lisboa')).toBe(false)
    // A name that merely contains the letters is not a children's race.
    expect(isChildrensRace('Corrida da Minifábrica')).toBe(false)
  })
})

describe('the German mile', () => {
  it('reads "1 Meile" as a mile, like "1 mile"', () => {
    // Real pill from a German calendar: the "New Balance KÖ MEILE".
    expect(parseDistancesKm(['1 Meile'])).toEqual([1.6093])
    expect(parseDistancesKm(['5 Meilen'])).toEqual([8.0467])
  })

  it('leaves a metre reading alone', () => {
    expect(parseDistancesKm(['800 m'])).toEqual([0.8])
  })
})

describe('numbers that share one unit', () => {
  it('reads every distance in "3,3 / 6,6 / 9,9 km"', () => {
    // Real description: "mit drei Strecken (3,3 / 6,6 / 9,9 km)".
    expect(parseDistancesKm(['Team Lauf mit drei Strecken (3,3 / 6,6 / 9,9 km)'])).toEqual([
      3.3, 6.6, 9.9,
    ])
  })

  it('reads a list written with & or +', () => {
    expect(parseDistancesKm(['Strecken 5 & 10 km'])).toEqual([5, 10])
    expect(parseDistancesKm(['10 + 21 km'])).toEqual([10, 21])
  })

  it('leaves a single distance exactly as it was', () => {
    expect(parseDistancesKm(['Halbmarathon 21,0975 km'])).toEqual([21.0975])
  })
})
