import { describe, expect, it } from 'vitest'
import { getBucketListViewMode, setBucketListViewMode } from './bucketListViewMode'

describe('bucketListViewMode', () => {
  it('defaults to lista', () => {
    expect(getBucketListViewMode('test-user-bucket-map')).toBe('lista')
  })

  it('persists mapa mode per user', () => {
    const userId = `test-user-bucket-map-${Date.now()}`
    setBucketListViewMode('mapa', userId)
    expect(getBucketListViewMode(userId)).toBe('mapa')
    setBucketListViewMode('lista', userId)
  })
})
