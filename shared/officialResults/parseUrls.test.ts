import { describe, expect, it } from 'vitest'
import { detectPlatform, detectPlatformFromUrl } from './detectPlatform'
import { parseDavengoUrl, parseRaceResultUrl, parseSccEventsUrl, parseSporthiveUrl, parkrunProfileUrl } from './parseUrls'
import { isParkrunEventName, resultsPlatformLabel } from './types'

describe('detectPlatform', () => {
  it('detects davengo from url', () => {
    expect(
      detectPlatformFromUrl(
        'https://www.davengo.com/event/result/great-10k-2025/search?category=10%20km%20Lauf',
      ),
    ).toBe('davengo')
  })

  it('detects sporthive from url', () => {
    expect(
      detectPlatformFromUrl('https://sporthive.com/events/s/7375922975814115328/race/7375922975814115840'),
    ).toBe('sporthive')
  })

  it('detects myraceresult from url', () => {
    expect(
      detectPlatformFromUrl('https://my.raceresult.com/228931/results#3_47CB35'),
    ).toBe('myraceresult')
  })

  it('detects myraceresult from embedded event page hash', () => {
    expect(
      detectPlatformFromUrl('https://mittsommer-lauf.de/ergebnislisten/#1_A472E2'),
    ).toBe('myraceresult')
  })

  it('detects sccevents from city night url', () => {
    expect(
      detectPlatformFromUrl('https://www.berlin-citynight.de/event/ergebnisse'),
    ).toBe('sccevents')
  })

  it('detects sccevents from english results path', () => {
    expect(
      detectPlatformFromUrl('https://www.generali-berliner-halbmarathon.de/en/your-race/results'),
    ).toBe('sccevents')
  })

  it('detects sccevents from german results path', () => {
    expect(
      detectPlatformFromUrl('https://www.generali-berliner-halbmarathon.de/das-rennen/ergebnisse'),
    ).toBe('sccevents')
  })

  it('detects parkrun from event name', () => {
    expect(detectPlatform(undefined, 'Havelkanal parkrun')).toBe('parkrun')
  })
})

describe('parseDavengoUrl', () => {
  it('extracts slug and category', () => {
    const parts = parseDavengoUrl(
      'https://www.davengo.com/event/result/great-10k-2025/search?category=10%20km%20Lauf',
    )
    expect(parts).toEqual({
      eventSlug: 'great-10k-2025',
      category: '10 km Lauf',
      listUrl: 'https://www.davengo.com/event/result/great-10k-2025/search/list',
      pageUrl: 'https://www.davengo.com/event/result/great-10k-2025/search?category=10%20km%20Lauf',
    })
  })
})

describe('parseSporthiveUrl', () => {
  it('extracts race id and api url', () => {
    const parts = parseSporthiveUrl(
      'https://sporthive.com/events/s/7375922975814115328/race/7375922975814115840',
    )
    expect(parts?.raceId).toBe('7375922975814115840')
    expect(parts?.apiUrl).toBe(
      'https://eventresults-api.speedhive.com/sporthive/races/7375922975814115840/participants',
    )
  })
})

describe('parseRaceResultUrl', () => {
  it('extracts event id, contest and list id from hash', () => {
    const parts = parseRaceResultUrl('https://my.raceresult.com/228931/results#3_47CB35')
    expect(parts).toEqual({
      eventId: '228931',
      contest: '3',
      listId: '47CB35',
      pageUrl: 'https://my.raceresult.com/228931/results#3_47CB35',
    })
  })

  it('accepts urls without hash', () => {
    const parts = parseRaceResultUrl('https://my.raceresult.com/274966/results')
    expect(parts?.eventId).toBe('274966')
    expect(parts?.contest).toBeUndefined()
    expect(parts?.listId).toBeUndefined()
  })

  it('accepts short event urls with hash only', () => {
    const parts = parseRaceResultUrl('https://my.raceresult.com/154660/#1_5162DB')
    expect(parts).toEqual({
      eventId: '154660',
      contest: '1',
      listId: '5162DB',
      pageUrl: 'https://my.raceresult.com/154660/#1_5162DB',
    })
  })

  it('parses embedded event pages with raceresult hash', () => {
    const parts = parseRaceResultUrl('https://mittsommer-lauf.de/ergebnislisten/#1_A472E2')
    expect(parts).toEqual({
      contest: '1',
      listId: 'A472E2',
      pageUrl: 'https://mittsommer-lauf.de/ergebnislisten/#1_A472E2',
    })
  })
})

describe('parseSccEventsUrl', () => {
  it('extracts page and referer origin from /event/ergebnisse', () => {
    expect(parseSccEventsUrl('https://www.berlin-citynight.de/event/ergebnisse')).toEqual({
      pageUrl: 'https://www.berlin-citynight.de/event/ergebnisse',
      refererOrigin: 'https://www.berlin-citynight.de',
    })
  })

  it('accepts /your-race/results paths', () => {
    expect(parseSccEventsUrl('https://www.generali-berliner-halbmarathon.de/en/your-race/results')).toEqual({
      pageUrl: 'https://www.generali-berliner-halbmarathon.de/en/your-race/results',
      refererOrigin: 'https://www.generali-berliner-halbmarathon.de',
    })
  })

  it('accepts /das-rennen/ergebnisse paths', () => {
    expect(parseSccEventsUrl('https://www.generali-berliner-halbmarathon.de/das-rennen/ergebnisse')).toEqual({
      pageUrl: 'https://www.generali-berliner-halbmarathon.de/das-rennen/ergebnisse',
      refererOrigin: 'https://www.generali-berliner-halbmarathon.de',
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseSccEventsUrl('https://www.generali-berliner-halbmarathon.de/en/your-race/course')).toBeNull()
  })
})

describe('parkrunProfileUrl', () => {
  it('uses parkrun.com.de', () => {
    expect(parkrunProfileUrl('490')).toBe('https://www.parkrun.com.de/parkrunner/490/all/')
  })
})

describe('resultsPlatformLabel', () => {
  it('formats myraceresult as MyRaceResult', () => {
    expect(resultsPlatformLabel('myraceresult')).toBe('MyRaceResult')
  })

  it('formats sccevents as SCC Events', () => {
    expect(resultsPlatformLabel('sccevents')).toBe('SCC Events')
  })
})

describe('isParkrunEventName', () => {
  it('matches parkrun variants', () => {
    expect(isParkrunEventName('Mauerpark parkrun')).toBe(true)
    expect(isParkrunEventName('Park Run Berlin')).toBe(true)
    expect(isParkrunEventName('Berlin Half')).toBe(false)
  })
})
