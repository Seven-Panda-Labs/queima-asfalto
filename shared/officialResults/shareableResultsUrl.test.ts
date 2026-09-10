import { describe, expect, it } from 'vitest'
import { shareableResultsUrl } from './shareableResultsUrl'

describe('shareableResultsUrl', () => {
  it('keeps what names the edition, including the distance', () => {
    // Rewritten even when nothing is dropped, so the parentheses come back
    // percent-encoded: the same page, and the same string for two runners.
    expect(
      shareableResultsUrl(
        'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search?category=5%20km%20(Sonntag)',
      ),
    ).toBe(
      'https://www.davengo.com/event/result/volvo-tierparklauf-2024/search?category=5%20km%20%28Sonntag%29',
    )
  })

  it('drops a search for the runner s own name', () => {
    // Measured: two of 39 saved links carried the surname in the query.
    expect(
      shareableResultsUrl(
        'https://www.davengo.com/event/result/20-ikk-bb-berliner-firmenlauf-2022/search?term=neves&category=10%20km',
      ),
    ).toBe(
      'https://www.davengo.com/event/result/20-ikk-bb-berliner-firmenlauf-2022/search?category=10%20km',
    )
  })

  it('drops one person s result row but keeps the event it is on', () => {
    expect(
      shareableResultsUrl(
        'https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239&result-id=207297#ergebnisse',
      ),
    ).toBe('https://myracepartner.com/veranstaltung/ergebnisse/?event-id=179239')
  })

  it('keeps an id that names the competition', () => {
    expect(shareableResultsUrl('https://b2run-iframe.maxfunsports.com/event/competition?id=345&lang=de')).toBe(
      'https://b2run-iframe.maxfunsports.com/event/competition?id=345&lang=de',
    )
  })

  it('refuses a path that is somebody s result', () => {
    expect(shareableResultsUrl('https://timing.example/events/42/athlete/91827')).toBeUndefined()
  })

  it('refuses what is not a link, or not one to open', () => {
    expect(shareableResultsUrl(undefined)).toBeUndefined()
    expect(shareableResultsUrl('  ')).toBeUndefined()
    expect(shareableResultsUrl('resultados.pdf')).toBeUndefined()
    expect(shareableResultsUrl('javascript:alert(1)')).toBeUndefined()
    expect(shareableResultsUrl('https://runner:secret@timing.example/results')).toBeUndefined()
  })
})
