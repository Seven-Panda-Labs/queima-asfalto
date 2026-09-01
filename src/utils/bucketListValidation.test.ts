import { describe, expect, it } from 'vitest'
import {
  MAX_BUCKET_LIST_DISCIPLINES,
  validateBucketListItem,
} from './bucketListValidation'

function item(overrides: Partial<Parameters<typeof validateBucketListItem>[0]> = {}) {
  return {
    name: 'Maratona do Porto',
    location: 'Porto',
    realDistance: 42.195,
    disciplines: ['km_42_2' as const],
    ...overrides,
  }
}

describe('validateBucketListItem', () => {
  it('accepts a race listing up to the ceiling of disciplines', () => {
    const result = validateBucketListItem(
      item({ disciplines: ['m_1500', 'm_3000', 'km_5', 'km_10', 'km_15', 'mi_10'] }),
    )
    expect(result.valid).toBe(true)
  })

  it('says so rather than letting the rules reject the write', () => {
    const result = validateBucketListItem(
      item({ disciplines: ['m_1500', 'm_3000', 'km_5', 'km_10', 'km_15', 'mi_10', 'km_21_1'] }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors.disciplines).toContain(String(MAX_BUCKET_LIST_DISCIPLINES))
  })

  it('still requires at least one discipline', () => {
    const result = validateBucketListItem(item({ disciplines: [] }))
    expect(result.valid).toBe(false)
    expect(result.errors.disciplines).toBeTruthy()
  })
})
