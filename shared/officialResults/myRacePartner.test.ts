import { describe, expect, it } from 'vitest'
import fixture from './fixtures/myracepartner-nikolauslauf-sample.csv?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseMyRacePartnerUrl } from './parseUrls'
import {
  buildMyRacePartnerCsvUrl,
  normalizeMyRacePartnerUrl,
  parseMyRacePartnerCsv,
  parseMyRacePartnerHtmlRows,
  parseMyRacePartnerResultIdsFromHtml,
  parseMyRacePartnerSummaryTotalFromHtml,
  parseMyRacePartnerTime,
  parseSemicolonCsvLine,
} from './myRacePartner'
import { namesMatchFullName } from './matchName'
import { resultsPlatformLabel } from './types'

const nikolauslaufUrl =
  'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239&result-id=207297#ergebnisse'

describe('detectPlatformFromUrl', () => {
  it('detects myracepartner from results url', () => {
    expect(detectPlatformFromUrl(nikolauslaufUrl)).toBe('myracepartner')
  })

  it('detects myracepartner when ids are only in the hash query', () => {
    expect(
      detectPlatformFromUrl(
        'https://myracepartner.com/veranstaltung/ergebnisse/#ergebnisse?event-id=179239&result-id=207297',
      ),
    ).toBe('myracepartner')
  })
})

describe('normalizeMyRacePartnerUrl', () => {
  it('moves query params from hash into search params', () => {
    expect(
      normalizeMyRacePartnerUrl(
        'https://myracepartner.com/veranstaltung/ergebnisse/#ergebnisse?event-id=179239&result-id=207297',
      ),
    ).toBe(
      'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239&result-id=207297#ergebnisse',
    )
  })
})

describe('parseMyRacePartnerUrl', () => {
  it('extracts result and event ids', () => {
    expect(parseMyRacePartnerUrl(nikolauslaufUrl)).toEqual({
      resultId: '207297',
      eventId: '179239',
      pageUrl: nikolauslaufUrl,
      origin: 'https://myracepartner.com',
    })
  })

  it('accepts event-id only and normalizes hash query params', () => {
    expect(
      parseMyRacePartnerUrl(
        'https://myracepartner.com/veranstaltung/ergebnisse/#ergebnisse?event-id=179239&result-id=207297',
      ),
    ).toEqual({
      resultId: '207297',
      eventId: '179239',
      pageUrl:
        'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239&result-id=207297#ergebnisse',
      origin: 'https://myracepartner.com',
    })
  })

  it('accepts event-id only without result-id', () => {
    expect(
      parseMyRacePartnerUrl(
        'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239',
      ),
    ).toEqual({
      resultId: '',
      eventId: '179239',
      pageUrl: 'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239',
      origin: 'https://myracepartner.com',
    })
  })

  it('rejects urls without event-id or result-id', () => {
    expect(parseMyRacePartnerUrl('https://myracepartner.com/veranstaltung/ergebnisse/')).toBeNull()
  })
})

describe('buildMyRacePartnerCsvUrl', () => {
  it('builds csv export endpoint', () => {
    expect(buildMyRacePartnerCsvUrl('207297')).toBe(
      'https://myracepartner.com/wp-admin/admin-post.php?action=mrp_export_results_csv&result-id=207297',
    )
  })
})

describe('parseSemicolonCsvLine', () => {
  it('handles quoted name fields', () => {
    expect(
      parseSemicolonCsvLine(
        'Veranstaltungsname;Streckentitel;84.;75.;#;"Hartmut Lindenberg";1975;;7.;M;35;0,00;"in 1:01:23"',
      ),
    ).toEqual([
      'Veranstaltungsname',
      'Streckentitel',
      '84.',
      '75.',
      '#',
      'Hartmut Lindenberg',
      '1975',
      '',
      '7.',
      'M',
      '35',
      '0,00',
      'in 1:01:23',
    ])
  })
})

describe('parseMyRacePartnerTime', () => {
  it('parses minute and hour formats', () => {
    expect(parseMyRacePartnerTime('in 59:29,35')).toBe('00:59:29')
    expect(parseMyRacePartnerTime('in 1:02:34,56')).toBe('01:02:34')
  })
})

describe('parseMyRacePartnerCsv', () => {
  it('parses rows from fixture', () => {
    const rows = parseMyRacePartnerCsv(fixture)
    expect(rows).toHaveLength(3)
    expect(rows[1]).toEqual({
      position: 84,
      name: 'Hartmut Lindenberg',
      note: 'in 1:01:23',
    })
  })

  it('matches profile against parsed names', () => {
    const rows = parseMyRacePartnerCsv(fixture)
    const profile = { resultFirstName: 'Hartmut', resultLastName: 'Lindenberg' }
    const match = rows.find((row) => namesMatchFullName(profile, row.name))
    expect(match?.position).toBe(84)
    expect(parseMyRacePartnerTime(match!.note)).toBe('01:01:23')
  })
})

describe('parseMyRacePartnerHtmlRows', () => {
  it('parses result rows from html table', () => {
    const html = `
      <tr class="result-123 row">
        <td>84.</td><td>75.</td>
        <td><a href="#">Hartmut Lindenberg</a></td>
        <td></td><td></td>
        <td>1:01:23<small></small></td>
      </tr>
    `
    expect(parseMyRacePartnerHtmlRows(html)).toEqual([
      { position: 84, name: 'Hartmut Lindenberg', time: '01:01:23' },
    ])
  })
})

describe('parseMyRacePartnerResultIdsFromHtml', () => {
  it('extracts result ids from page html', () => {
    const html = `
      <option value="https://myracepartner.com/veranstaltung/ergebnisse/?result-id=207297">Quarter</option>
      <input data-frmval="207298" />
    `
    expect(parseMyRacePartnerResultIdsFromHtml(html)).toEqual(['207297', '207298'])
  })
})

describe('parseMyRacePartnerSummaryTotalFromHtml', () => {
  it('reads total participants from summary text', () => {
    expect(parseMyRacePartnerSummaryTotalFromHtml('<div>242 Ergebnisse</div>')).toBe(242)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats myracepartner as MyRacePartner', () => {
    expect(resultsPlatformLabel('myracepartner')).toBe('MyRacePartner')
  })
})
