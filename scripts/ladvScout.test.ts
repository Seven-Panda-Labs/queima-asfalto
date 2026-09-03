import { describe, expect, it } from 'vitest'
import {
  listDistancesKm,
  parseLadvEventPage,
  parseLadvResultList,
  parseLadvSitemap,
  slugLooksLikeARace,
  slugMentionsTown,
} from './ladvScout.js'

/** The sitemap's shape, with the town written into the slug as LADV writes it. */
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ladv.de/veranstaltung/detail/34415/49.-Musterheider-Park-Lauf-Musterstadt.htm</loc></url>
  <url><loc>https://ladv.de/veranstaltung/detail/34652/Hallensportfest-M%C3%A4-Fr-U20-U18-Musterstadt.htm</loc></url>
  <url><loc>https://ladv.de/veranstaltung/detail/32487/13.-Neust%C3%A4dter-Stadtlauf-Neustadt-am-R%C3%BCbenberge.htm</loc></url>
  <url><loc>https://ladv.de/veranstaltung/detail/34175/31.-Bismarckturmlauf-Neustadt-an-der-Orla.htm</loc></url>
</urlset>`

function section(discipline: string, date: string, rows: [number, string][]): string {
  const entries = rows
    .map(
      ([position, time]) => `
<div class="erg_einzel erg_bright">
  <div class="erg_row">
    <div class="platz">${position}.</div>
    <div class="number">3910${position}</div>
    <div class="erg_athlet"><a href="/leistungsdatenbank/athletenprofil/1/Fictional-Runner.htm">Mustermann, Max</a></div>
    <div class="birthyear">1998</div>
    <div class="nation">NI&nbsp;</div>
    <div class="club">LG Musterstadt</div>
    <div class="performance">${time}</div>
    <div class="wind">&nbsp;</div>
  </div>
</div>`,
    )
    .join('')

  return `
<div class="erg_headline">${discipline}</div>
<div class="erg_headline_wind">&nbsp;</div>
<div class="erg_headline_right">${date}</div>
${entries}`
}

const RESULT_LIST = `<html><body>
${section('5 km Straße (5-km Lauf männlich/Finale) - Männer', '09.11.2025', [
  [1, '16:23'],
  [2, '16:25'],
  [3, '16:27'],
  [4, '16:41'],
])}
${section('5 km Straße (5-km Lauf weiblich/Finale) - Frauen', '09.11.2025', [
  [1, '17:30'],
  [2, '17:56'],
  [3, '18:32'],
])}
${section('5 km Straße (5-km Lauf männlich/Finale) - M40', '09.11.2025', [
  [1, '17:04'],
  [2, '17:44'],
])}
<div id="footer">nothing here</div>
</body></html>`

const EVENT_PAGE = `<html><head><title>49. Musterheider Park-Lauf</title></head><body>
<a href="/ergebnisse/95568/49.-Musterheider-Park-Lauf-Ergebnisliste-5-km-f%C3%BCr-Statistiker-Musterstadt-2025.htm">5 km</a>
<a href="/ergebnisse/95568/49.-Musterheider-Park-Lauf-Ergebnisliste-5-km-f%C3%BCr-Statistiker-Musterstadt-2025.htm">5 km again</a>
<a href="/ergebnisse/95569/49.-Musterheider-Park-Lauf-Ergebnisliste-10-km-f%C3%BCr-Statistiker-Musterstadt-2025.htm">10 km</a>
<a href="/niedersachsen/ergebnisse">Niedersachsen</a>
</body></html>`

describe('parseLadvSitemap', () => {
  it('reads the id and the slug, and gives the slug back readable', () => {
    const events = parseLadvSitemap(SITEMAP)

    expect(events).toHaveLength(4)
    expect(events[0]).toEqual({
      eventId: '34415',
      url: 'https://ladv.de/veranstaltung/detail/34415/49.-Musterheider-Park-Lauf-Musterstadt.htm',
      slug: '49.-Musterheider-Park-Lauf-Musterstadt',
    })
    expect(events[2]?.slug).toBe('13.-Neustädter-Stadtlauf-Neustadt-am-Rübenberge')
  })
})

describe('slugMentionsTown', () => {
  it('finds the town wherever it sits in the slug', () => {
    expect(slugMentionsTown('49.-Musterheider-Park-Lauf-Musterstadt', ['Musterstadt'])).toBe(true)
    expect(
      slugMentionsTown('13.-Neustädter-Stadtlauf-Neustadt-am-Rübenberge', ['Neustadt-am-R']),
    ).toBe(true)
  })

  it('keeps two towns of the same name apart', () => {
    // Real data: a Neustadt in Thuringia is not the Neustadt near Hannover.
    expect(slugMentionsTown('31.-Bismarckturmlauf-Neustadt-an-der-Orla', ['Neustadt-am-R'])).toBe(
      false,
    )
  })
})

describe('slugLooksLikeARace', () => {
  it('keeps a race on foot', () => {
    expect(slugLooksLikeARace('49.-Musterheider-Park-Lauf-Musterstadt')).toBe(true)
    expect(slugLooksLikeARace('28.-Musterheider-Volkslauf-Musterstadt')).toBe(true)
    expect(slugLooksLikeARace('47.-Muster-Deister-Marathon-Springe')).toBe(true)
  })

  it('drops the track and field that fills this calendar', () => {
    expect(slugLooksLikeARace('Hallensportfest-Mä-Fr-U20-U18-Musterstadt')).toBe(false)
    expect(slugLooksLikeARace('Landesoffener-Werfertag-KM-Musterstadt')).toBe(false)
    expect(slugLooksLikeARace('Schülermehrkampf-mit-Staffeln-Musterstadt')).toBe(false)
    expect(slugLooksLikeARace('offene-Kreismeisterschaft-Sprint-Staffel-Musterstadt')).toBe(false)
  })
})

describe('listDistancesKm', () => {
  it('reads a distance however the slug hyphenates it', () => {
    // All three of these are five kilometres, from three organisers.
    expect(listDistancesKm('49.-Muster-Lauf-Ergebnisliste-5-km-für-Statistiker-Musterstadt-2025')).toEqual([5])
    expect(listDistancesKm('48.-Muster-Deister-Marathon-5k-Springe-2026')).toEqual([5])
    expect(listDistancesKm('3.-Abend-Kanallauf-Ergebnisliste-MW--Lauf-3--5000m-Sehnde-2026')).toEqual([5])
  })

  it('reads ten kilometres and the marathon apart', () => {
    expect(listDistancesKm('49.-Muster-Lauf-Ergebnisliste-10-km-Musterstadt-2025')).toEqual([10])
    expect(listDistancesKm('48.-Muster-Deister-Marathon-Ergebnisliste-Marathon-Springe-2026')).toEqual([42.195])
  })
})

describe('parseLadvEventPage', () => {
  it('takes the name the page gives itself', () => {
    expect(parseLadvEventPage(EVENT_PAGE)?.name).toBe('49. Musterheider Park-Lauf')
  })

  it('lists each result list once, with the distance still in the slug', () => {
    const lists = parseLadvEventPage(EVENT_PAGE)?.resultLists ?? []

    expect(lists).toHaveLength(2)
    expect(lists[0]?.listId).toBe('95568')
    expect(lists[0]?.slug).toContain('5-km')
    expect(lists[0]?.url).toBe(
      'https://ladv.de/ergebnisse/95568/49.-Musterheider-Park-Lauf-Ergebnisliste-5-km-für-Statistiker-Musterstadt-2025.htm',
    )
    expect(lists[1]?.slug).toContain('10-km')
  })

  it('drops the platform\'s own "updated" marker from the name', () => {
    const page = EVENT_PAGE.replace('<title>49.', '<title>[akt.] 49.')
    expect(parseLadvEventPage(page)?.name).toBe('49. Musterheider Park-Lauf')
  })

  it('refuses a page with no title', () => {
    expect(parseLadvEventPage('<html><body>nothing</body></html>')).toBeNull()
  })
})

describe('parseLadvResultList', () => {
  it('reads the distance, the surface and the day off the headline', () => {
    const men = parseLadvResultList(RESULT_LIST)[0]

    expect(men).toMatchObject({
      distanceKm: 5,
      group: 'm',
      surface: 'road',
      date: '2025-11-09',
    })
  })

  it('takes the first three and stops', () => {
    const men = parseLadvResultList(RESULT_LIST)[0]

    expect(men?.places.map((place) => place.time)).toEqual(['16:23', '16:25', '16:27'])
    expect(men?.places.map((place) => place.seconds)).toEqual([983, 985, 987])
  })

  it('reads the women\'s section as its own podium', () => {
    const women = parseLadvResultList(RESULT_LIST)[1]

    expect(women?.group).toBe('w')
    expect(women?.places[0]?.time).toBe('17:30')
  })

  it('leaves an age class without a group, so it is not a podium', () => {
    const sections = parseLadvResultList(RESULT_LIST)

    expect(sections).toHaveLength(3)
    expect(sections[2]?.discipline).toContain('M40')
    expect(sections[2]?.group).toBeNull()
  })

  it('works out the podium by time, because the printed place can be a class place', () => {
    // Real shape: the women's 10 km list opens with the over-eighties, each age
    // class starting again at one.
    const classGrouped = parseLadvResultList(
      section('10 km Straße (10-km weiblich/Finale) - Frauen', '30.08.2026', [
        [1, '1:01:50'],
        [1, '1:04:51'],
        [1, '37:49'],
        [2, '38:06'],
        [1, '39:23'],
      ]),
    )[0]

    expect(classGrouped?.places.map((place) => place.time)).toEqual(['37:49', '38:06', '39:23'])
    expect(classGrouped?.places.map((place) => place.position)).toEqual([1, 2, 3])
    expect(classGrouped?.finishers).toBe(5)
  })

  it('counts the whole class, not just the podium', () => {
    const sections = parseLadvResultList(RESULT_LIST)

    expect(sections[0]?.finishers).toBe(4)
    expect(sections[0]?.places).toHaveLength(3)
    expect(sections[1]?.finishers).toBe(3)
  })

  it('does not read runners names', () => {
    const places = parseLadvResultList(RESULT_LIST).flatMap((entry) => entry.places)

    expect(places.length).toBeGreaterThan(0)
    expect(places.every((place) => place.name === '')).toBe(true)
  })

  it('tells a cross race from a road race', () => {
    const cross = parseLadvResultList(
      section('4,2 km Cross (Crosslauf männlich/Finale) - Männer', '01.02.2025', [[1, '14:02']]),
    )[0]

    expect(cross?.surface).toBe('cross')
  })
})
