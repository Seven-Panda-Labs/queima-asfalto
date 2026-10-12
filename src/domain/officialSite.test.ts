import { describe, expect, it } from 'vitest'
import { normalizeWebUrl, officialSite, webUrl } from './officialSite'

const LISTING = 'https://www.runme.de/laufen/ze-ninguem-lauf'
const ORGANISER = 'https://ze-ninguem-lauf.example/'

describe('officialSite', () => {
  it('is the organiser link the catalog resolved', () => {
    expect(officialSite({ officialUrl: LISTING }, { officialUrl: ORGANISER })).toBe(ORGANISER)
  })

  it('is an organiser site the harvest read directly', () => {
    // Read from the organiser, so both URLs on the entry are the same site.
    expect(officialSite(undefined, { officialUrl: ORGANISER })).toBe(ORGANISER)
  })

  it('prefers the organiser to a calendar, wherever each one is', () => {
    expect(officialSite(undefined, { officialUrl: LISTING, registrationUrl: ORGANISER })).toBe(
      ORGANISER,
    )
  })

  it('falls back to the calendar page when that is all there is', () => {
    expect(officialSite({ officialUrl: LISTING }, { officialUrl: LISTING, sourceUrl: LISTING })).toBe(
      LISTING,
    )
  })

  it('is the entry page an organiser set up on a platform', () => {
    const davengo = 'https://www.davengo.com/event/overview/ze-ninguem-lauf-2026'
    expect(officialSite(undefined, { officialUrl: davengo })).toBe(davengo)
  })

  it('is the race copy when there is no entry to read', () => {
    expect(officialSite({ officialUrl: ORGANISER }, undefined)).toBe(ORGANISER)
  })

  it('is nothing when nobody knows it', () => {
    expect(officialSite({}, null)).toBeUndefined()
    expect(officialSite(undefined, undefined)).toBeUndefined()
  })
})

describe('webUrl', () => {
  it('takes web addresses only', () => {
    expect(webUrl(ORGANISER)).toBe(ORGANISER)
    expect(webUrl('javascript:alert(1)')).toBeUndefined()
    expect(webUrl('not a url')).toBeUndefined()
  })

  it('refuses a host no browser can open', () => {
    expect(webUrl('https://,ze-ninguem-lauf.example')).toBeUndefined()
    expect(webUrl('https://ze-ninguem-lauf')).toBeUndefined()
  })
})

describe('normalizeWebUrl', () => {
  it('adds the scheme an operator left out', () => {
    expect(normalizeWebUrl('ze-ninguem-lauf.example')).toBe('https://ze-ninguem-lauf.example/')
    expect(normalizeWebUrl(' http://ze-ninguem-lauf.example/x ')).toBe('http://ze-ninguem-lauf.example/x')
  })

  it('is nothing for an empty field and null for something that is not an address', () => {
    expect(normalizeWebUrl('  ')).toBeUndefined()
    expect(normalizeWebUrl('https://,ze-ninguem-lauf.example')).toBeNull()
    expect(normalizeWebUrl('mailto:ze@ninguem.example')).toBeNull()
  })
})
