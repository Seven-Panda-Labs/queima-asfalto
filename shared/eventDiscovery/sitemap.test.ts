import { describe, expect, it } from 'vitest'
import { parseSitemap, rotatePages, selectEventUrls } from './sitemap'

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://acorrer.pt/</loc><lastmod>2026-09-01T00:00:00+01:00</lastmod></url>
  <url><loc>https://acorrer.pt/eventos</loc><lastmod>2026-09-01T00:00:00+01:00</lastmod></url>
  <url>
    <loc>https://acorrer.pt/eventos/10-run-castle</loc>
    <lastmod>2026-08-20T00:00:00+01:00</lastmod>
    <changefreq>daily</changefreq>
  </url>
  <url><loc>https://acorrer.pt/eventos/trail-do-zezere?ref=a&amp;b=1</loc></url>
  <url><changefreq>daily</changefreq></url>
</urlset>`

describe('parseSitemap', () => {
  it('reads every url, with the lastmod when there is one', () => {
    const entries = parseSitemap(XML)

    expect(entries).toHaveLength(4)
    expect(entries[2]).toEqual({
      url: 'https://acorrer.pt/eventos/10-run-castle',
      lastmod: '2026-08-20T00:00:00+01:00',
    })
    expect(entries[3]!.lastmod).toBeUndefined()
  })

  it('unescapes what the xml escaped', () => {
    expect(parseSitemap(XML)[3]!.url).toBe('https://acorrer.pt/eventos/trail-do-zezere?ref=a&b=1')
  })

  it('has nothing to say about something that is not a sitemap', () => {
    expect(parseSitemap('<html><body>403</body></html>')).toEqual([])
  })
})

describe('selectEventUrls', () => {
  const selection = { pathPrefix: '/eventos/', limit: 10 }

  it('keeps the event pages and drops the site around them', () => {
    expect(selectEventUrls(parseSitemap(XML), selection)).toEqual([
      'https://acorrer.pt/eventos/10-run-castle',
      'https://acorrer.pt/eventos/trail-do-zezere?ref=a&b=1',
    ])
  })

  it('puts the most recently changed page first', () => {
    const entries = [
      { url: 'https://a.invalid/eventos/old', lastmod: '2026-01-01' },
      { url: 'https://a.invalid/eventos/new', lastmod: '2026-08-01' },
    ]
    expect(selectEventUrls(entries, selection)[0]).toBe('https://a.invalid/eventos/new')
  })

  it('caps the work', () => {
    const entries = Array.from({ length: 50 }, (_, index) => ({
      url: `https://a.invalid/eventos/${index}`,
    }))
    expect(selectEventUrls(entries, { ...selection, limit: 5 })).toHaveLength(5)
  })

  it('drops a duplicate and anything that is not a url', () => {
    const entries = [
      { url: 'https://a.invalid/eventos/x' },
      { url: 'https://a.invalid/eventos/x' },
      { url: 'not a url at all' },
    ]
    expect(selectEventUrls(entries, selection)).toEqual(['https://a.invalid/eventos/x'])
  })
})

describe('rotatePages', () => {
  const urls = ['a', 'b', 'c', 'd', 'e']

  it('reads the first slice, then the next one', () => {
    expect(rotatePages(urls, 2, 0)).toEqual(['a', 'b'])
    expect(rotatePages(urls, 2, 2)).toEqual(['c', 'd'])
  })

  it('wraps around, so every page is read in the end', () => {
    expect(rotatePages(urls, 2, 4)).toEqual(['e', 'a'])
    expect(rotatePages(urls, 2, 6)).toEqual(['b', 'c'])
  })

  it('takes a limit past the end, and an empty list', () => {
    expect(rotatePages(urls, 99, 3)).toEqual(['d', 'e', 'a', 'b', 'c'])
    expect(rotatePages([], 10, 3)).toEqual([])
  })
})
