import { describe, expect, it } from 'vitest'
import {
  buildSporthiveParticipantsUrl,
  buildSporthiveSearchUrl,
  SPORTRIVE_PAGE_SIZE,
} from './sporthive'

describe('buildSporthiveParticipantsUrl', () => {
  it('uses API max page size', () => {
    expect(SPORTRIVE_PAGE_SIZE).toBe(10)
    expect(
      buildSporthiveParticipantsUrl(
        'https://eventresults-api.speedhive.com/sporthive/races/123/participants',
        3,
      ),
    ).toBe(
      'https://eventresults-api.speedhive.com/sporthive/races/123/participants?size=10&category=ALL_RESULTS&page=3',
    )
  })
})

describe('buildSporthiveSearchUrl', () => {
  it('uses ActiveRace category like the website', () => {
    expect(buildSporthiveSearchUrl('event-1', 'race-1', 'neves', 10)).toBe(
      'https://eventresults-api.speedhive.com/sporthive/search?term=neves&sport=&category=ActiveRace&count=10&offset=10&type=Participants&eventid=event-1&raceid=race-1&fuzzy=false',
    )
  })
})
