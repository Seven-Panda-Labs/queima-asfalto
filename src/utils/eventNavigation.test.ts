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
    expect(isSafeReturnPath('/analise?year=2023')).toBe(true)
    expect(isSafeReturnPath('/eventos')).toBe(true)
    expect(isSafeReturnPath('https://evil.com')).toBe(false)
    expect(isSafeReturnPath('/definicoes')).toBe(false)
  })

  it('still accepts the legacy analysis path', () => {
    expect(isSafeReturnPath('/resultados?year=2023')).toBe(true)
    expect(getReturnTo({ returnTo: '/resultados?year=2020' })).toBe('/resultados?year=2020')
  })

  it('falls back to events list', () => {
    expect(getReturnTo(null)).toBe('/eventos')
    expect(getReturnTo({ returnTo: '/definicoes' })).toBe('/eventos')
    expect(getReturnTo({ returnTo: '/analise?year=2020' })).toBe('/analise?year=2020')
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
      'owner=owner-1&returnTo=%2Fanalise%3Fyear%3D2020%26owner%3Downer-1',
    )
    expect(getEventDetailReturnTo(null, detailParams)).toBe('/analise?year=2020&owner=owner-1')
    expect(getEventDetailReturnTo({ returnTo: '/analise?owner=owner-1' }, detailParams)).toBe(
      '/analise?owner=owner-1',
    )

    const legacyParams = new URLSearchParams(
      'owner=owner-1&returnTo=%2Fresultados%3Fyear%3D2020%26owner%3Downer-1',
    )
    expect(getEventDetailReturnTo(null, legacyParams)).toBe('/resultados?year=2020&owner=owner-1')
  })

  it('parses and builds analysis URLs', () => {
    const filters = parseResultsListSearchParams(new URLSearchParams('year=2021&type=km_21_1'), 2026)
    expect(filters).toEqual({ horizon: 'epoca', year: 2021, type: 'km_21_1' })
    expect(buildResultsListPath(filters, 2026)).toBe('/analise?year=2021&type=km_21_1')
    expect(buildResultsListPath(filters, 2026, 'owner-1')).toBe(
      '/analise?year=2021&type=km_21_1&owner=owner-1',
    )
  })

  it('defaults to the season horizon and rejects unknown ones', () => {
    expect(parseResultsListSearchParams(new URLSearchParams(''), 2026).horizon).toBe('epoca')
    expect(parseResultsListSearchParams(new URLSearchParams('view=mapa'), 2026).horizon).toBe('epoca')
    expect(parseResultsListSearchParams(new URLSearchParams('view=sempre'), 2026).horizon).toBe(
      'sempre',
    )
  })

  it('drops the year outside the season horizon, where it means nothing', () => {
    const allTime = { horizon: 'sempre' as const, year: 2021, type: 'all' as const }
    expect(buildResultsListPath(allTime, 2026)).toBe('/analise?view=sempre')

    const seasons = { horizon: 'epocas' as const, year: 'all' as const, type: 'km_5' as const }
    expect(buildResultsListPath(seasons, 2026)).toBe('/analise?view=epocas&type=km_5')
  })
})
