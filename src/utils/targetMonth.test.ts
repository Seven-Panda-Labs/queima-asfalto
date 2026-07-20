import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { formatTargetMonth, targetMonthSortIndex } from './targetMonth'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

describe('formatTargetMonth', () => {
  it('formats English month keys to Portuguese labels', () => {
    expect(formatTargetMonth('September')).toBe('Setembro')
    expect(formatTargetMonth('January ')).toBe('Janeiro')
  })

  it('returns dash for empty values', () => {
    expect(formatTargetMonth()).toBe('—')
    expect(formatTargetMonth('')).toBe('—')
  })
})

describe('targetMonthSortIndex', () => {
  it('orders months chronologically', () => {
    expect(targetMonthSortIndex('January')).toBeLessThan(targetMonthSortIndex('December'))
    expect(targetMonthSortIndex()).toBe(13)
  })
})
