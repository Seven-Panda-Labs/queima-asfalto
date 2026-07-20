import { describe, expect, it } from 'vitest'
import { namesMatch } from './matchName'
import berlinFixture from './fixtures/raceresult-berlin-5km-snippet.json'
import herbstFixture from './fixtures/raceresult-herbstwaldlauf-snippet.json'
import herbstSearchFixture from './fixtures/raceresult-herbstwaldlauf-search-snippet.json'
import mittsommerGroupFixture from './fixtures/raceresult-mittsommer-group-snippet.json'
import mittsommerSearchFixture from './fixtures/raceresult-mittsommer-search-neves-snippet.json'
import sovdFixture from './fixtures/raceresult-sovd-snippet.json'
import {
  buildRaceResultConfigUrl,
  buildRaceResultListUrl,
  buildRaceResultSearchUrl,
  computeRaceResultOverallPosition,
  extractRaceResultEventIdFromHtml,
  flattenRaceResultData,
  listsToSearch,
  namesMatchRaceResultDisplay,
  parseRaceResultEmbedHash,
  parseRaceResultName,
  raceResultDataRows,
  raceResultFieldIndexes,
  resolveRaceResultList,
  shouldComputeRaceResultOverallRank,
  totalParticipantsFromRaceResultData,
  type RaceResultConfig,
} from './raceresult'

describe('buildRaceResultConfigUrl', () => {
  it('builds config endpoint', () => {
    expect(buildRaceResultConfigUrl('228931')).toBe(
      'https://my2.raceresult.com/228931/results/config',
    )
  })
})

describe('buildRaceResultSearchUrl', () => {
  it('builds search endpoint like the website', () => {
    const url = buildRaceResultSearchUrl({
      eventId: '274966',
      key: 'abc123',
      listName: '05 - Ergebnisse veröffentlicht|01 - Ergebnisliste',
      contest: '0',
      term: 'neves',
    })
    expect(url).toContain('/274966/results/list?')
    expect(url).toContain('r=search')
    expect(url).toContain('term=neves')
    expect(url).toContain('openedGroups=%7B%7D')
    expect(url).toContain('f=')
  })
})

describe('buildRaceResultListUrl', () => {
  it('builds list endpoint with group mode', () => {
    const url = buildRaceResultListUrl({
      eventId: '228931',
      key: 'abc123',
      listName: 'Online|Ergebnis',
      contest: '3',
    })
    expect(url).toContain('/228931/results/list?')
    expect(url).toContain('key=abc123')
    expect(url).toContain('listname=Online%7CErgebnis')
    expect(url).toContain('contest=3')
    expect(url).toContain('r=group')
  })
})

describe('resolveRaceResultList', () => {
  const config: RaceResultConfig = {
    key: 'test-key',
    TabConfig: {
      Lists: [
        { Name: 'Online|Ergebnis', Contest: '3', ID: '47CB35' },
        { Name: 'Other|List', Contest: '0', ID: 'AAAAAA' },
      ],
    },
  }

  it('prefers list id from hash', () => {
    expect(resolveRaceResultList(config, '47CB35', '0')?.Name).toBe('Online|Ergebnis')
  })

  it('falls back to contest', () => {
    expect(resolveRaceResultList(config, undefined, '0')?.ID).toBe('AAAAAA')
  })
})

describe('listsToSearch', () => {
  const config: RaceResultConfig = {
    key: 'test-key',
    TabConfig: {
      Lists: [
        { Name: 'Main|List', Contest: '0', ID: 'MAIN' },
        { Name: 'Family|List', Contest: '0', ID: 'FAMILY' },
      ],
    },
  }

  it('searches primary list first then the rest', () => {
    expect(listsToSearch(config, 'FAMILY', '0').map((list) => list.ID)).toEqual(['FAMILY', 'MAIN'])
  })
})

describe('raceResultFieldIndexes', () => {
  it('maps berlin fields', () => {
    expect(raceResultFieldIndexes(berlinFixture.DataFields)).toEqual({
      name: 4,
      time: 7,
      rank: 2,
    })
  })

  it('maps herbstwaldlauf fields', () => {
    expect(raceResultFieldIndexes(herbstFixture.DataFields)).toEqual({
      name: 4,
      time: 8,
      rank: 2,
    })
  })

  it('maps sovd formula fields', () => {
    expect(raceResultFieldIndexes(sovdFixture.DataFields)).toEqual({
      name: 4,
      time: 6,
      rank: 2,
    })
  })

  it('maps mittsommer nettozeit fields', () => {
    expect(raceResultFieldIndexes(mittsommerSearchFixture.DataFields)).toEqual({
      name: 3,
      time: 7,
    })
  })
})

describe('parseRaceResultName', () => {
  it('parses western order', () => {
    expect(parseRaceResultName('Kjell Arved Brandt')).toEqual({
      first: 'Kjell',
      last: 'Arved Brandt',
    })
  })

  it('parses last-first comma format', () => {
    expect(parseRaceResultName('BENITZ, Timo')).toEqual({
      first: 'Timo',
      last: 'BENITZ',
    })
  })

  it('parses uppercase-last format', () => {
    expect(parseRaceResultName('MASLOWSKI Jennifer')).toEqual({
      first: 'Jennifer',
      last: 'MASLOWSKI',
    })
  })
})

describe('namesMatchRaceResultDisplay', () => {
  it('matches comma-separated german names', () => {
    expect(
      namesMatchRaceResultDisplay(
        { resultFirstName: 'Rodrigo', resultLastName: 'Fortes' },
        'FORTES, Rodrigo',
      ),
    ).toBe(true)
  })

  it('matches when all profile parts appear in display text', () => {
    expect(
      namesMatchRaceResultDisplay(
        { resultFirstName: 'Timo', resultLastName: 'Benitz' },
        'BENITZ, Timo',
      ),
    ).toBe(true)
  })
})

describe('raceResult data helpers', () => {
  it('extracts participant rows and total', () => {
    expect(raceResultDataRows(berlinFixture.data)).toHaveLength(2)
    expect(totalParticipantsFromRaceResultData(berlinFixture.data)).toBe(826)
  })

  it('flattens grouped search results', () => {
    expect(raceResultDataRows(herbstSearchFixture.data)).toHaveLength(1)
    expect(raceResultDataRows(herbstSearchFixture.data)[0]?.[4]).toBe('PEÑA, Maria')
    expect(totalParticipantsFromRaceResultData(herbstSearchFixture.data)).toBe(127)
    expect(flattenRaceResultData(herbstSearchFixture.data)).toHaveLength(2)
  })

  it('matches maria pena from grouped search fixture', () => {
    const indexes = raceResultFieldIndexes(herbstSearchFixture.DataFields)!
    const row = raceResultDataRows(herbstSearchFixture.data)[0]!
    expect(
      namesMatchRaceResultDisplay(
        { resultFirstName: 'Maria', resultLastName: 'Peña' },
        row[indexes.name]!,
      ),
    ).toBe(true)
  })

  it('matches berlin participant by profile name', () => {
    const indexes = raceResultFieldIndexes(berlinFixture.DataFields)!
    const row = raceResultDataRows(berlinFixture.data)[0]!
    const { first, last } = parseRaceResultName(row[indexes.name]!)
    expect(
      namesMatch({ resultFirstName: 'Kjell', resultLastName: 'Brandt' }, first, last),
    ).toBe(true)
  })

  it('matches herbstwaldlauf participant by profile name', () => {
    const indexes = raceResultFieldIndexes(herbstFixture.DataFields)!
    const row = raceResultDataRows(herbstFixture.data)[0]!
    const { first, last } = parseRaceResultName(row[indexes.name]!)
    expect(namesMatch({ resultFirstName: 'Timo', resultLastName: 'Benitz' }, first, last)).toBe(
      true,
    )
  })

  it('matches sovd participant by profile name', () => {
    const indexes = raceResultFieldIndexes(sovdFixture.DataFields)!
    const row = raceResultDataRows(sovdFixture.data)[0]!
    const { first, last } = parseRaceResultName(row[indexes.name]!)
    expect(
      namesMatch({ resultFirstName: 'Jennifer', resultLastName: 'Maslowski' }, first, last),
    ).toBe(true)
  })

  it('flattens doubly nested mittsommer search results', () => {
    expect(raceResultDataRows(mittsommerSearchFixture.data)).toHaveLength(1)
    expect(raceResultDataRows(mittsommerSearchFixture.data)[0]?.[3]).toBe('Griesbach, Dieter')
    expect(flattenRaceResultData(mittsommerSearchFixture.data)).toHaveLength(2)
  })

  it('matches dieter griesbach from mittsommer search fixture', () => {
    const indexes = raceResultFieldIndexes(mittsommerSearchFixture.DataFields)!
    const row = raceResultDataRows(mittsommerSearchFixture.data)[0]!
    expect(
      namesMatchRaceResultDisplay(
        { resultFirstName: 'Dieter', resultLastName: 'Griesbach' },
        row[indexes.name]!,
      ),
    ).toBe(true)
    expect(row[indexes.time]).toBe('0:51:47')
  })
})

describe('parseRaceResultEmbedHash', () => {
  it('parses contest and list id from embedded page hash', () => {
    expect(
      parseRaceResultEmbedHash('https://mittsommer-lauf.de/ergebnislisten/#1_A472E2'),
    ).toEqual({
      contest: '1',
      listId: 'A472E2',
    })
  })
})

describe('extractRaceResultEventIdFromHtml', () => {
  it('reads event id from RRPublish embed', () => {
    const html =
      'var rrp=new RRPublish(document.getElementById("motion"), 346809, "results");'
    expect(extractRaceResultEventIdFromHtml(html)).toBe('346809')
  })
})

describe('shouldComputeRaceResultOverallRank', () => {
  it('detects category-only rank fields', () => {
    expect(shouldComputeRaceResultOverallRank(mittsommerSearchFixture.DataFields, undefined)).toBe(
      true,
    )
    expect(shouldComputeRaceResultOverallRank(berlinFixture.DataFields, 2)).toBe(false)
  })
})

describe('computeRaceResultOverallPosition', () => {
  it('computes overall position across merged category groups', () => {
    const indexes = raceResultFieldIndexes(mittsommerGroupFixture.DataFields)!
    const overall = computeRaceResultOverallPosition(
      raceResultDataRows(mittsommerGroupFixture.data),
      indexes,
      { resultFirstName: 'Dieter', resultLastName: 'Griesbach' },
      '00:51:47',
    )

    expect(overall).toEqual({
      position: 230,
      totalParticipants: 252,
    })
  })
})
