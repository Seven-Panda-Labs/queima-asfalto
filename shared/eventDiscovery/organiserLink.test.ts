import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readOrganiserLink } from './organiserLink'

const runme = readFileSync('shared/eventDiscovery/fixtures/runme-organiser-link.html', 'utf8')
const runningLife = readFileSync(
  'shared/eventDiscovery/fixtures/running-life-organiser-link.html',
  'utf8',
)

describe('readOrganiserLink', () => {
  it('reads the site runme.de points at', () => {
    expect(readOrganiserLink(runme)).toBe('http://www.dubaimarathon.org/')
  })

  it('reads the site running.life points at', () => {
    expect(readOrganiserLink(runningLife)).toBe('https://grimming-volkslauf.at/')
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
