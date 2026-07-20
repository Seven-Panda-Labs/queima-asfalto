import { describe, expect, it } from 'vitest'
import searchFixture from './fixtures/scc-events-city-night-search.json'
import {
  buildSccEventConfigUrl,
  buildSccResultsSearchUrl,
  isSccEventsResultsPath,
  isSccRunningCompetition,
  parseSccEventKeyFromHtml,
  resolveSccEdition,
  runningCompetitionsForEdition,
  type SccEventsEventConfig,
} from './sccEvents'
import { buildSccEventsSearchTerm } from './sccEventsSearch'

describe('isSccEventsResultsPath', () => {
  it('matches known scc results paths', () => {
    expect(isSccEventsResultsPath('/event/ergebnisse')).toBe(true)
    expect(isSccEventsResultsPath('/en/your-race/results')).toBe(true)
    expect(isSccEventsResultsPath('/das-rennen/ergebnisse')).toBe(true)
    expect(isSccEventsResultsPath('/en/your-race/course')).toBe(false)
  })
})

describe('buildSccEventConfigUrl', () => {
  it('builds event config endpoint', () => {
    expect(buildSccEventConfigUrl('CN')).toBe('https://api.results.scc-events.com/event/CN')
  })
})

describe('buildSccResultsSearchUrl', () => {
  it('builds global search endpoint', () => {
    const url = buildSccResultsSearchUrl({
      eventKey: 'CN',
      competitionIdent: 'CN10',
      year: '2025',
      tableName: 'CN_2025',
      term: 'Vollmann',
    })
    expect(url).toContain('search%5Bvalue%5D=Vollmann')
    expect(url).toContain('ci=CN10')
    expect(url).toContain('t=CN_2025')
  })
})

describe('parseSccEventKeyFromHtml', () => {
  it('extracts event key from data-url-config attribute', () => {
    const html =
      '<div data-url-config="https://api.results.scc-events.com/event/HM" data-url-result="https://api.results.scc-events.com/result"></div>'
    expect(parseSccEventKeyFromHtml(html)).toBe('HM')
  })

  it('extracts event key from results page html', () => {
    const html = '<script src="https://api.results.scc-events.com/event/CN"></script>'
    expect(parseSccEventKeyFromHtml(html)).toBe('CN')
  })
})

describe('resolveSccEdition', () => {
  const config: SccEventsEventConfig = {
    ident: 'CN',
    editions: {
      '2025': {
        year: 2025,
        competitions: [
          { competition_ident: 'CN10', label_de: '10 km Lauf', tablename: 'CN_2025' },
          { competition_ident: 'CNSB', label_de: 'Inline-Skating Speed/Teams', tablename: 'CN_2025' },
        ],
      },
    },
  }

  it('returns edition for year', () => {
    expect(resolveSccEdition(config, 2025)?.competitions).toHaveLength(2)
  })

  it('filters running competitions', () => {
    const edition = resolveSccEdition(config, 2025)!
    expect(runningCompetitionsForEdition(edition).map((c) => c.competition_ident)).toEqual(['CN10'])
    expect(isSccRunningCompetition({ competition_ident: 'X', label_de: 'Inline-Skating', tablename: 'X' })).toBe(
      false,
    )
  })

  it('includes läufer runner competition (half marathon)', () => {
    expect(
      isSccRunningCompetition({ competition_ident: 'HML', label_de: 'Läufer', label_en: 'Runner', tablename: 'HM_2024' }),
    ).toBe(true)
    expect(
      isSccRunningCompetition({ competition_ident: 'HMR', label_de: 'Rollstuhlfahrer', tablename: 'HM_2024' }),
    ).toBe(false)
    expect(isSccRunningCompetition({ competition_ident: 'HMH', label_de: 'Handbiker', tablename: 'HM_2024' })).toBe(
      false,
    )
  })
})

describe('buildSccEventsSearchTerm', () => {
  it('prefers last name', () => {
    expect(buildSccEventsSearchTerm({ resultFirstName: 'Zé', resultLastName: 'Ninguém' })).toBe('Ninguém')
  })
})

describe('scc search fixture', () => {
  it('contains vollmann result', () => {
    expect(searchFixture.data[0]?.nachname).toBe('Vollmann')
    expect(searchFixture.data[0]?.netto).toBe('01:03:01')
  })
})
