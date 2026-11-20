import { describe, expect, it } from 'vitest'
import racePage from './fixtures/berlin-timing-race-page.html?raw'
import tenKm from './fixtures/berlin-timing-10km.html?raw'
import tenKmByAgeClass from './fixtures/berlin-timing-10km-nach-ak.html?raw'
import {
  matchBerlinTimingRankings,
  parseBerlinTimingRankingUrls,
  parseBerlinTimingResultRows,
  parseBerlinTimingTime,
  parseBerlinTimingUrl,
} from './berlinTiming'
import { detectPlatformFromUrl } from './detectPlatform'
import { resultsPlatformLabel } from './types'

const racePageUrl = 'https://www.berlin-timing.de/Beispiel-Lauf'
const rankingUrl = 'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/10_km'
const profile = { resultFirstName: 'Zé', resultLastName: 'Ninguém' }

function table(headers: string[], rows: string[][]): string {
  const th = headers.map((header) => `<th>${header}</th>`).join('')
  const tr = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')
  return `<table class="table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`
}

describe('Berlin-Timing links', () => {
  it('detects the race page, a ranking and the results index', () => {
    expect(detectPlatformFromUrl(racePageUrl)).toBe('berlintiming')
    expect(detectPlatformFromUrl(rankingUrl)).toBe('berlintiming')
    expect(detectPlatformFromUrl('https://berlin-timing.de/ergebnisse')).toBe('berlintiming')
    expect(detectPlatformFromUrl('https://www.berlin-timing.example/Beispiel-Lauf')).toBeNull()
    expect(resultsPlatformLabel('berlintiming')).toBe('Berlin-Timing')
  })

  it('reads a ranking link from its race page, which lists every edition', () => {
    expect(parseBerlinTimingUrl(rankingUrl)).toEqual({ pageUrl: racePageUrl })
    expect(parseBerlinTimingUrl(racePageUrl)).toEqual({ pageUrl: racePageUrl })
  })
})

describe('parseBerlinTimingRankingUrls', () => {
  it('lists the rankings of the edition on the given dates, in page order', () => {
    expect(parseBerlinTimingRankingUrls(racePage, racePageUrl, ['2026-06-20', '2026-06-21', '2026-06-22'])).toEqual([
      'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/10_km',
      'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/10_km_nach_AK',
      'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/5_km',
      'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/Staffel',
    ])
  })

  it('finds nothing when no edition was held on those dates', () => {
    expect(parseBerlinTimingRankingUrls(racePage, racePageUrl, ['2024-06-23'])).toEqual([])
  })
})

describe('parseBerlinTimingTime', () => {
  it('reads hours, minutes and tenths', () => {
    expect(parseBerlinTimingTime('0:44:30')).toBe('00:44:30')
    expect(parseBerlinTimingTime('1:02:03')).toBe('01:02:03')
    expect(parseBerlinTimingTime('40:49')).toBe('00:40:49')
    expect(parseBerlinTimingTime('3:12.4')).toBe('00:03:12')
    expect(parseBerlinTimingTime('')).toBeNull()
  })
})

describe('parseBerlinTimingResultRows', () => {
  it('reads the finishers and skips a runner who did not finish', () => {
    const rows = parseBerlinTimingResultRows(tenKm)

    expect(rows.map((row) => row.fullName)).toEqual([
      'Max Mustermann',
      'Erika Mustermann',
      'Zé Ninguém',
      'Hans Meier',
    ])
    expect(rows[2]).toEqual({ position: 3, fullName: 'Zé Ninguém', time: '00:44:30' })
  })

  it('skips the age class headings of a ranking by age class', () => {
    expect(parseBerlinTimingResultRows(tenKmByAgeClass)).toHaveLength(4)
  })

  it('reads a first name kept in its own column, and headers with stray NULs', () => {
    const html = table(
      ['Platz', '\0Vorname', '\0Name', '\0Endzeit'],
      [['7', 'Zé', 'Ninguém', '1:45:02']],
    )

    expect(parseBerlinTimingResultRows(html)).toEqual([
      { position: 7, fullName: 'Zé Ninguém', time: '01:45:02' },
    ])
  })

  it('gives nothing for a triathlon, a relay or a lap count', () => {
    const triathlon = table(
      ['Platz', 'Stnr', 'Name', 'Endzeit', 'Schwimm', 'Rad', 'Lauf'],
      [['1', '9', 'Zé Ninguém', '1:10:00', '0:12:00', '0:35:00', '0:23:00']],
    )
    const relay = table(
      ['Gesamt', 'Team', 'Starter1', 'Starter2', 'Endzeit'],
      [['1', 'Die Schnellen', 'Zé Ninguém', 'Erika Mustermann', '0:40:00']],
    )
    const laps = table(['Platz', 'Startnr', 'Name', 'Runden', 'Distanz'], [['1', '9', 'Zé Ninguém', '12', '12 km']])

    expect(parseBerlinTimingResultRows(triathlon)).toEqual([])
    expect(parseBerlinTimingResultRows(relay)).toEqual([])
    expect(parseBerlinTimingResultRows(laps)).toEqual([])
  })
})

describe('matchBerlinTimingRankings', () => {
  const ageClassUrl = 'https://www.berlin-timing.de/Beispiel-Lauf/Ergebnis/2026-06-21/10_km_nach_AK'

  it('returns the runner once, from the first ranking that lists the finish', () => {
    const candidates = matchBerlinTimingRankings(
      [
        { url: rankingUrl, html: tenKm },
        { url: ageClassUrl, html: tenKmByAgeClass },
      ],
      profile,
    )

    expect(candidates).toEqual([
      {
        platform: 'berlintiming',
        matchedName: 'Zé Ninguém',
        time: '00:44:30',
        position: 3,
        totalParticipants: 4,
        sourceUrl: rankingUrl,
        confidence: 'high',
      },
    ])
  })

  it('finds nothing for a runner in none of the rankings', () => {
    expect(
      matchBerlinTimingRankings([{ url: rankingUrl, html: tenKm }], {
        resultFirstName: 'Lieschen',
        resultLastName: 'Müller',
      }),
    ).toEqual([])
  })
})
