import { describe, expect, it } from 'vitest'
import { selectEnabledSources } from './sources'

const sources = [{ id: 'acorrer.pt' }, { id: 'davengo.com' }]

describe('selectEnabledSources', () => {
  it('is off by default: an upgrade never starts scraping anybody', () => {
    expect(selectEnabledSources(sources, undefined)).toEqual([])
    expect(selectEnabledSources(sources, '')).toEqual([])
    expect(selectEnabledSources(sources, '  ')).toEqual([])
  })

  it('enables what the operator named, however they spaced it', () => {
    expect(selectEnabledSources(sources, ' Acorrer.PT ')).toEqual([{ id: 'acorrer.pt' }])
    expect(selectEnabledSources(sources, 'acorrer.pt,davengo.com')).toHaveLength(2)
  })

  it('ignores a source that does not exist', () => {
    expect(selectEnabledSources(sources, 'ahotu.com')).toEqual([])
  })

  it('takes all of them, for an operator who means all of them', () => {
    expect(selectEnabledSources(sources, 'all')).toHaveLength(2)
  })
})
