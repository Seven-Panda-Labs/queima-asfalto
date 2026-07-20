import { describe, expect, it } from 'vitest'
import { formatEventLocation, formatGeoapifyLabel, geocodingLanguage } from '../services/geoapify'
import { coordinatesMatchLocation, eventHasCoordinates, eventNeedsGeocoding } from '../services/eventGeocoding'
import { eventsWithCoordinates, eventsWithoutCoordinates } from '../utils/eventMap'
import type { Event } from '../types/Event'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'e1',
    userId: 'u1',
    name: 'Test',
    date: new Date('2026-01-01'),
    realDistance: 10,
    eventType: 'km_10',
    location: 'Berlin',
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('geocodingLanguage', () => {
  it('maps pt to pt for Geoapify', () => {
    expect(geocodingLanguage('pt')).toBe('pt')
    expect(geocodingLanguage('pt-PT')).toBe('pt')
  })

  it('defaults to en for other languages', () => {
    expect(geocodingLanguage('en')).toBe('en')
    expect(geocodingLanguage('de')).toBe('en')
  })
})

describe('formatEventLocation', () => {
  it('simplifies street-level results to area and city', () => {
    expect(
      formatEventLocation({
        formatted: 'Jungfernheide, Max-Dohrn-Straße, 10589 Berlim, Alemanha',
        name: 'Jungfernheide',
        street: 'Max-Dohrn-Straße',
        suburb: 'Jungfernheide',
        city: 'Berlim',
        result_type: 'building',
      }),
    ).toBe('Jungfernheide, Berlim')
  })

  it('collapses duplicate street suggestions to the same label', () => {
    const streetA = formatEventLocation({
      formatted: 'Jungfernheide, Max-Dohrn-Straße, 10589 Berlim, Alemanha',
      street: 'Max-Dohrn-Straße',
      suburb: 'Jungfernheide',
      city: 'Berlim',
      result_type: 'street',
    })
    const streetB = formatEventLocation({
      formatted: 'Jungfernheide, Lambertstraße, 10589 Berlim, Alemanha',
      street: 'Lambertstraße',
      suburb: 'Jungfernheide',
      city: 'Berlim',
      result_type: 'street',
    })
    expect(streetA).toBe('Jungfernheide, Berlim')
    expect(streetB).toBe('Jungfernheide, Berlim')
  })

  it('uses city name only for city results', () => {
    expect(
      formatEventLocation({
        name: 'Lisboa',
        city: 'Lisboa',
        country: 'Portugal',
        result_type: 'city',
      }),
    ).toBe('Lisboa')
  })

  it('includes amenity name with city', () => {
    expect(
      formatEventLocation({
        name: 'Estádio da Luz',
        city: 'Lisboa',
        result_type: 'amenity',
      }),
    ).toBe('Estádio da Luz, Lisboa')
  })
})

describe('formatGeoapifyLabel', () => {
  it('prefers formatted address', () => {
    expect(formatGeoapifyLabel({ formatted: 'Lisboa, Portugal' })).toBe('Lisboa, Portugal')
  })

  it('falls back to address lines', () => {
    expect(
      formatGeoapifyLabel({
        address_line1: 'Praça do Comércio',
        address_line2: 'Lisboa, Portugal',
      }),
    ).toBe('Praça do Comércio, Lisboa, Portugal')
  })

  it('returns null when no label fields', () => {
    expect(formatGeoapifyLabel({ lat: 1, lon: 2 })).toBeNull()
  })
})

describe('eventGeocoding helpers', () => {
  it('detects coordinates', () => {
    expect(eventHasCoordinates(makeEvent())).toBe(false)
    expect(eventHasCoordinates(makeEvent({ locationLat: 52.5, locationLng: 13.4 }))).toBe(true)
  })

  it('detects when geocoding is needed', () => {
    expect(eventNeedsGeocoding(makeEvent())).toBe(true)
    expect(eventNeedsGeocoding(makeEvent({ location: '' }))).toBe(false)
    expect(eventNeedsGeocoding(makeEvent({ location: '??' }))).toBe(false)
    expect(
      eventNeedsGeocoding(
        makeEvent({ locationLat: 52.5, locationLng: 13.4, locationGeocodeQuery: 'Berlin' }),
      ),
    ).toBe(false)
    expect(
      eventNeedsGeocoding(
        makeEvent({ locationLat: 52.5, locationLng: 13.4, locationGeocodeQuery: 'Lisboa' }),
      ),
    ).toBe(true)
  })

  it('matches geocode query to location', () => {
    expect(
      coordinatesMatchLocation({ location: 'Berlin', locationGeocodeQuery: 'berlin' }),
    ).toBe(true)
    expect(
      coordinatesMatchLocation({ location: 'Berlin', locationGeocodeQuery: 'Lisboa' }),
    ).toBe(false)
  })
})

describe('eventMap utils', () => {
  it('splits mapped and unmapped events', () => {
    const mapped = makeEvent({ id: 'a', locationLat: 1, locationLng: 2 })
    const unmapped = makeEvent({ id: 'b', location: 'Copenhagen' })
    const invalid = makeEvent({ id: 'c', location: '??' })

    expect(eventsWithCoordinates([mapped, unmapped, invalid])).toHaveLength(1)
    expect(eventsWithoutCoordinates([mapped, unmapped, invalid])).toHaveLength(1)
  })
})
