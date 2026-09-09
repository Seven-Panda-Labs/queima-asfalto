import { describe, expect, it } from 'vitest'
import {
  applyEditionReports,
  editionReportId,
  keepRunnerDate,
  type EditionReport,
} from './editionReports'
import type { RaceCatalogEntry } from './types'

const TODAY = '2026-09-09'

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'pt-lisboa-maratona-de-lisboa',
    name: 'Maratona de Lisboa',
    country: 'PT',
    city: 'Lisboa',
    disciplines: ['km_42_2'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'acorrer.pt',
    producer: 'harvest',
    ...overrides,
  }
}

function report(overrides: Partial<EditionReport> = {}): EditionReport {
  return {
    catalogRaceId: 'pt-lisboa-maratona-de-lisboa',
    year: 2026,
    uid: 'u1',
    raceDate: '2026-10-11',
    reportedAt: TODAY,
    ...overrides,
  }
}

const listing = {
  year: 2026,
  raceDate: '2026-10-10',
  registrationClosesAt: '2026-09-30',
  source: 'acorrer.pt',
  confirmedAt: '2026-09-01',
}

describe('editionReportId', () => {
  it('is one document per race, year and runner', () => {
    expect(editionReportId('pt-lisboa', 2026, 'u1')).toBe('pt-lisboa__2026__u1')
    expect(editionReportId('pt-lisboa', 2026, 'u1')).not.toBe(
      editionReportId('pt-lisboa', 2026, 'u2'),
    )
    expect(editionReportId('pt-lisboa', 2026, 'u1')).not.toBe(
      editionReportId('pt-lisboa', 2027, 'u1'),
    )
  })
})

describe('applyEditionReports', () => {
  it('corrects the day the listing got wrong', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ raceDate: '2026-10-11' })],
      TODAY,
    )

    expect(updated?.editions?.[0]).toMatchObject({
      raceDate: '2026-10-11',
      runnerConfirmedAt: TODAY,
      // What the listing said about the gates is untouched.
      registrationClosesAt: '2026-09-30',
      source: 'acorrer.pt',
    })
  })

  it('gives the catalog a year it never had', () => {
    // The harvest only ever writes the edition still ahead, so a runner is the
    // only way the catalog learns about the ones already run.
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ year: 2024, raceDate: '2024-10-13' })],
      TODAY,
    )

    expect(updated?.editions).toHaveLength(2)
    expect(updated?.editions?.[0]).toMatchObject({
      year: 2024,
      raceDate: '2024-10-13',
      source: 'runners',
    })
  })

  it('keeps nextRaceDate true to the editions it just changed', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing], nextRaceDate: '2026-10-10' }),
      [report({ raceDate: '2026-10-11' })],
      TODAY,
    )

    expect(updated?.nextRaceDate).toBe('2026-10-11')
  })

  it('takes the earliest day when an event runs over a weekend', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ uid: 'u1', raceDate: '2026-10-11' }), report({ uid: 'u2', raceDate: '2026-10-10' })],
      TODAY,
    )

    expect(updated?.editions?.[0]?.raceDate).toBe('2026-10-10')
  })

  it('has nothing to write when the catalog already says so', () => {
    const confirmed = { ...listing, runnerConfirmedAt: '2026-09-01' }
    expect(
      applyEditionReports(entry({ editions: [confirmed] }), [report({ raceDate: '2026-10-10' })], TODAY),
    ).toBeNull()
  })

  it('confirms a date the listing had right, so the next harvest keeps it', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ raceDate: '2026-10-10' })],
      TODAY,
    )

    expect(updated?.editions?.[0]?.runnerConfirmedAt).toBe(TODAY)
  })

  it('ignores a report about another race', () => {
    expect(
      applyEditionReports(
        entry({ editions: [listing] }),
        [report({ catalogRaceId: 'de-berlin-berlin-marathon' })],
        TODAY,
      ),
    ).toBeNull()
  })

  it('never promotes the entry to reviewed', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ raceDate: '2026-10-11' })],
      TODAY,
    )

    // A runner knows the day they ran. They cannot vouch for a deadline that
    // has not happened, and `canAssertDates` is what reads this.
    expect(updated?.review).toBe('unreviewed')
  })
})

describe('keepRunnerDate', () => {
  it('carries a confirmed date across a harvest that would overwrite it', () => {
    const existing = { ...listing, raceDate: '2026-10-11', runnerConfirmedAt: TODAY }
    const kept = keepRunnerDate({ ...listing, registrationClosesAt: '2026-10-01' }, existing)

    expect(kept.raceDate).toBe('2026-10-11')
    expect(kept.runnerConfirmedAt).toBe(TODAY)
    // A deadline published since is news, and it arrives.
    expect(kept.registrationClosesAt).toBe('2026-10-01')
  })

  it('leaves the listing alone when no runner confirmed anything', () => {
    expect(keepRunnerDate(listing, listing).raceDate).toBe('2026-10-10')
    expect(keepRunnerDate(listing, undefined).raceDate).toBe('2026-10-10')
  })
})
