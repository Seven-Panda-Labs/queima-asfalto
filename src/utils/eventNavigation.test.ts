import { describe, expect, it } from 'vitest'
import {
  buildEventDetailPath,
  buildEventsListPath,
  buildResultsListPath,
  getEventDetailReturnTo,
  getReturnTo,
  isSafeReturnPath,
  parseEventsListSearchParams,
  parseResultsListSearchParams,
} from './eventNavigation'

describe('eventNavigation', () => {
  it('validates safe return paths', () => {
    expect(isSafeReturnPath('/resultados?year=2023')).toBe(true)
    expect(isSafeReturnPath('/eventos')).toBe(true)
    expect(isSafeReturnPath('https://evil.com')).toBe(false)
    expect(isSafeReturnPath('/definicoes')).toBe(false)
  })

  it('falls back to events list', () => {
    expect(getReturnTo(null)).toBe('/eventos')
    expect(getReturnTo({ returnTo: '/definicoes' })).toBe('/eventos')
    expect(getReturnTo({ returnTo: '/resultados?year=2020' })).toBe('/resultados?year=2020')
  })

  it('parses and builds events list URLs', () => {
    const filters = parseEventsListSearchParams(
      new URLSearchParams('status=completed&year=2023&view=mapa'),
      2026,
      'lista',
    )
    expect(filters).toEqual({ status: 'completed', year: 2023, view: 'mapa' })
    expect(buildEventsListPath(filters, 2026)).toBe('/eventos?status=completed&year=2023&view=mapa')
  })

  it('builds shared event detail paths and return URLs', () => {
    expect(buildEventDetailPath('evt-1')).toBe('/eventos/evt-1')
    expect(buildEventDetailPath('evt-1', { ownerId: 'owner-1' })).toBe('/eventos/evt-1?owner=owner-1')
    expect(
      buildEventDetailPath('evt-1', {
        ownerId: 'owner-1',
        returnTo: '/eventos?view=calendario&owner=owner-1',
      }),
    ).toBe('/eventos/evt-1?owner=owner-1&returnTo=%2Feventos%3Fview%3Dcalendario%26owner%3Downer-1')

    const sharedListParams = new URLSearchParams('owner=owner-1')
    expect(getEventDetailReturnTo(null, sharedListParams)).toBe('/eventos?owner=owner-1')

    const detailParams = new URLSearchParams(
      'owner=owner-1&returnTo=%2Fresultados%3Fyear%3D2020%26owner%3Downer-1',
    )
    expect(getEventDetailReturnTo(null, detailParams)).toBe('/resultados?year=2020&owner=owner-1')
    expect(getEventDetailReturnTo({ returnTo: '/resultados?owner=owner-1' }, detailParams)).toBe(
      '/resultados?owner=owner-1',
    )
  })

  it('parses and builds results list URLs', () => {
    const filters = parseResultsListSearchParams(new URLSearchParams('year=2021&type=km_21_1'), 2026)
    expect(filters).toEqual({ year: 2021, type: 'km_21_1' })
    expect(buildResultsListPath(filters, 2026)).toBe('/resultados?year=2021&type=km_21_1')
    expect(buildResultsListPath(filters, 2026, 'owner-1')).toBe(
      '/resultados?year=2021&type=km_21_1&owner=owner-1',
    )
  })
})
