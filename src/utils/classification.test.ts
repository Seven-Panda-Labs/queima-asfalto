import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { formatClassificationDisplay, parseClassification } from './classification'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

describe('parseClassification', () => {
  it('parses slash format', () => {
    expect(parseClassification('47/106')).toEqual({ position: 47, total: 106 })
  })

  it('parses "de" format', () => {
    expect(parseClassification('58 de 142')).toEqual({ position: 58, total: 142 })
  })

  it('parses "of" format', () => {
    expect(parseClassification('58 of 142')).toEqual({ position: 58, total: 142 })
  })

  it('returns null for invalid input', () => {
    expect(parseClassification('sem classificação')).toBeNull()
  })
})

describe('formatClassificationDisplay', () => {
  it('reformats stored values with locale', async () => {
    await i18n.changeLanguage('en')
    expect(formatClassificationDisplay('58 de 142')).toBe('58 of 142')
    await i18n.changeLanguage('pt')
    expect(formatClassificationDisplay('58/142')).toBe('58 de 142')
  })
})

