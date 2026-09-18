import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../raceCatalog/types'
import {
  needsOrganiserLink,
  pagesToReadForOrganiser,
  readOrganiserLink,
} from './organiserLink'

const runme = readFileSync('shared/eventDiscovery/fixtures/runme-organiser-link.html', 'utf8')
const runningLife = readFileSync(
  'shared/eventDiscovery/fixtures/running-life-organiser-link.html',
  'utf8',
)
const kilometerliebe = readFileSync(
  'shared/eventDiscovery/fixtures/kilometerliebe-organiser-link.html',
  'utf8',
)

describe('readOrganiserLink', () => {
  it('reads the site runme.de points at', () => {
    expect(readOrganiserLink(runme)).toBe('http://www.dubaimarathon.org/')
  })

  it('reads the site running.life points at', () => {
    expect(readOrganiserLink(runningLife)).toBe('https://grimming-volkslauf.at/')
  })

  it('reads the site kilometerliebe.de points at, past the arrow beside it', () => {
    // The label and a four-hundred character SVG share the anchor, and the
    // "add to calendar" button beside it carries the same class.
    expect(readOrganiserLink(kilometerliebe)).toBe('https://othaler-gutshof-lauf.de/')
  })

  it('does not take an entry form for the organiser', () => {
    // A future event's panel offers the timekeeper the same way, which is why
    // the class alone is not enough.
    expect(
      readOrganiserLink(
        '<a class="ev-bib__action" href="https://my.raceresult.com/123/">zur Anmeldung</a>',
      ),
    ).toBeUndefined()
  })

  it('does not take the platform for the organiser', () => {
    // Every runme.de page links its sister sites and the publisher, the same
    // way and in the same place.
    const platformOnly = `
      <a class="referer-link" target="webext" href="https://www.runme.at/">RUNME Österreich</a>
      <a class="referer-link" target="webext" href="https://www.evenager.com/x/">Veranstalter (evenager)</a>
      <a href="https://walking.life/" data-out="website">walking.life</a>
    `
    expect(readOrganiserLink(platformOnly)).toBeUndefined()
  })

  it('says nothing when the page offers no site', () => {
    expect(readOrganiserLink('<a href="https://example.org/">Ergebnisse</a>')).toBeUndefined()
    expect(readOrganiserLink('')).toBeUndefined()
  })

  it('refuses what is not a link to open', () => {
    expect(
      readOrganiserLink('<a data-out="website" href="mailto:info@example.org">Webseite</a>'),
    ).toBeUndefined()
  })
})

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'de-berlin-run',
    name: 'Berlin Run',
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_10'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'runme.de',
    producer: 'harvest',
    officialUrl: 'https://runme.de/laufe/berlin-run',
    sourceUrl: 'https://runme.de/laufe/berlin-run',
    ...overrides,
  }
}

describe('needsOrganiserLink', () => {
  it('takes an entry whose official link is the calendar it was found on', () => {
    expect(needsOrganiserLink(entry())).toBe(true)
    const listing = 'https://www.kilometerliebe.de/events/6-othaler-gutshof-lauf'
    expect(needsOrganiserLink(entry({ officialUrl: listing, sourceUrl: listing }))).toBe(true)
  })

  it('leaves an entry that already points at the organiser', () => {
    expect(needsOrganiserLink(entry({ officialUrl: 'https://berlin-run.de/' }))).toBe(false)
  })

  it('leaves a race that is out of the catalog, or known to be a copy', () => {
    expect(needsOrganiserLink(entry({ retired: true }))).toBe(false)
    expect(needsOrganiserLink(entry({ duplicateOfCatalogRaceId: 'de-berlin-marathon' }))).toBe(false)
  })

  it('leaves a site nobody has to read: it is not one of the two platforms', () => {
    const own = 'https://berlin-run.de/'
    expect(needsOrganiserLink(entry({ officialUrl: own, sourceUrl: own }))).toBe(false)
  })
})

describe('pagesToReadForOrganiser', () => {
  it('reads the pages nobody has read yet before the ones that gave nothing', () => {
    // Otherwise a night's budget goes on the same fruitless pages forever and
    // a race harvested last week is never looked at.
    const pages = pagesToReadForOrganiser(
      [
        entry({ id: 'de-read-yesterday', organiserLinkReadAt: '2026-09-17' }),
        entry({ id: 'de-never-read' }),
        entry({ id: 'de-read-in-june', organiserLinkReadAt: '2026-06-01' }),
      ],
      2,
    )

    expect(pages.map((page) => page.id)).toEqual(['de-never-read', 'de-read-in-june'])
  })

  it('reads nothing else', () => {
    expect(pagesToReadForOrganiser([entry({ officialUrl: 'https://berlin-run.de/' })], 10)).toEqual(
      [],
    )
  })
})
