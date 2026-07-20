import { describe, expect, it } from 'vitest'
import { redactBucketListItemForShare, redactEventForShare } from './redact.js'

describe('redactEventForShare', () => {
  const event = {
    id: 'e1',
    userId: 'owner',
    name: 'Maratona',
    date: '2026-01-01',
    realDistance: 42.2,
    eventType: 'km_42_2',
    location: 'Lisboa',
    status: 'completed',
    time: '03:30:00',
    pace: '05:00',
    classification: '123',
    notes: 'secret',
    resultsUrl: 'https://example.com',
    resultsPlatform: 'parkrun',
    locationGeocodeQuery: 'secret query',
  }

  it('strips results for read_no_results', () => {
    const redacted = redactEventForShare(event, 'read_no_results')
    expect(redacted).not.toHaveProperty('time')
    expect(redacted).not.toHaveProperty('notes')
    expect(redacted).not.toHaveProperty('resultsUrl')
    expect(redacted.name).toBe('Maratona')
  })

  it('includes times for read', () => {
    const redacted = redactEventForShare(event, 'read')
    expect(redacted.time).toBe('03:30:00')
    expect(redacted).not.toHaveProperty('notes')
    expect(redacted).not.toHaveProperty('resultsUrl')
  })

  it('includes times for write', () => {
    const redacted = redactEventForShare(event, 'write')
    expect(redacted.time).toBe('03:30:00')
    expect(redacted.pace).toBe('05:00')
  })
})

describe('redactBucketListItemForShare', () => {
  it('omits notes and geocode query', () => {
    const redacted = redactBucketListItemForShare({
      id: 'b1',
      userId: 'owner',
      name: 'Ultra',
      location: 'Porto',
      realDistance: 50,
      disciplines: ['km_42_2'],
      notes: 'secret',
      locationGeocodeQuery: 'secret',
    })
    expect(redacted).not.toHaveProperty('notes')
    expect(redacted).not.toHaveProperty('locationGeocodeQuery')
    expect(redacted.name).toBe('Ultra')
  })
})
