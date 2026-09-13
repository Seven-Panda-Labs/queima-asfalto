import { describe, expect, it } from 'vitest'
import { nameWithoutTown } from './duplicates'

describe('nameWithoutTown', () => {
  it('drops the town the entry already carries', () => {
    // Sixty-one characters, nineteen of them the town beside it on the row.
    expect(
      nameWithoutTown('Paarlauf im Rahmen des Sportabzeichentages - Frankfurt (Oder)', 'Frankfurt (Oder)'),
    ).toBe('Paarlauf im Rahmen des Sportabzeichentages')
    expect(nameWithoutTown('Lauf in den Herbst - Görlitz', 'Görlitz')).toBe('Lauf in den Herbst')
    expect(nameWithoutTown('RunTour – Pardubice', 'Pardubice')).toBe('RunTour')
  })

  it('reads a parenthesis at the end as the same thing', () => {
    expect(nameWithoutTown('Stundenlaufserie (Halle)', 'Halle (Saale)')).toBe('Stundenlaufserie')
  })

  it('never cuts a compound name in half', () => {
    // A hyphen glued to letters is part of a word, and both of these are real.
    expect(nameWithoutTown('Volksbank-Münster Marathon', 'Münster')).toBe(
      'Volksbank-Münster Marathon',
    )
    expect(nameWithoutTown('Spartan Race Zell am See-Kaprun', 'Kaprun')).toBe(
      'Spartan Race Zell am See-Kaprun',
    )
  })

  it('keeps the town when nothing else names the race', () => {
    // "Halve Marathon" is what every half marathon in the Netherlands is
    // called, so the town is the only thing telling two of them apart.
    expect(nameWithoutTown('Halve Marathon - Erpe-Mere', 'Erpe-Mere')).toBe(
      'Halve Marathon - Erpe-Mere',
    )
    expect(nameWithoutTown('Marathon - Berlin', 'Berlin')).toBe('Marathon - Berlin')
  })

  it('leaves alone what is not the town', () => {
    expect(nameWithoutTown('Lauf in den Herbst - Nachtlauf', 'Görlitz')).toBe(
      'Lauf in den Herbst - Nachtlauf',
    )
    expect(nameWithoutTown('Berlin Marathon', 'Berlin')).toBe('Berlin Marathon')
    expect(nameWithoutTown('Maratona de Lisboa', 'Lisboa')).toBe('Maratona de Lisboa')
  })

  it('says nothing new when there is no town to compare with', () => {
    expect(nameWithoutTown('Lauf in den Herbst - Görlitz', '')).toBe('Lauf in den Herbst - Görlitz')
  })
})
