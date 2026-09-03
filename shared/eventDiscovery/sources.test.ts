import { describe, expect, it } from 'vitest'
import { selectEnabledSources, sourceForRun } from './sources'

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

describe('sourceForRun', () => {
  const sources = ['a', 'b', 'c']

  it('reads one source, and the next one tomorrow', () => {
    const monday = new Date('2026-09-07T05:00:00Z')
    const tuesday = new Date('2026-09-08T05:00:00Z')
    expect(sourceForRun(sources, monday)).not.toBe(sourceForRun(sources, tuesday))
  })

  it('picks the same source however often a day is forced', () => {
    const morning = new Date('2026-09-07T05:00:00Z')
    const evening = new Date('2026-09-07T22:30:00Z')
    expect(sourceForRun(sources, morning)).toBe(sourceForRun(sources, evening))
  })

  it('comes back round, so every source is read every three days here', () => {
    const days = [0, 1, 2, 3].map((offset) =>
      sourceForRun(sources, new Date(Date.UTC(2026, 8, 7 + offset, 5))),
    )
    expect(new Set(days.slice(0, 3)).size).toBe(3)
    expect(days[3]).toBe(days[0])
  })

  it('has nothing to read when nothing is enabled', () => {
    expect(sourceForRun([], new Date())).toBeUndefined()
  })
})
