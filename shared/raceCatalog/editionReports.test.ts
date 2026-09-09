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

/** The listing with a fee on it, for the cases about overruling one. */


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
  it('takes a day two runners agree on against the listing', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ uid: 'u1', raceDate: '2026-10-11' }), report({ uid: 'u2', raceDate: '2026-10-11' })],
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

  it('does not take one runner s word against a published listing', () => {
    // A verified result proves this runner ran that year, and says nothing
    // about the day: the connectors pick the edition by year. The day in the
    // report came from their event, which may have been prefilled from this
    // very entry.
    expect(
      applyEditionReports(
        entry({ editions: [listing] }),
        [report({ uid: 'u1', raceDate: '2026-10-11' })],
        TODAY,
      ),
    ).toBeNull()
  })

  it('counts runners and not reports', () => {
    // One person cannot corroborate themselves by reporting twice, which the
    // document id already prevents, and this does not depend on that.
    expect(
      applyEditionReports(
        entry({ editions: [listing] }),
        [report({ uid: 'u1', raceDate: '2026-10-11' }), report({ uid: 'u1', raceDate: '2026-10-11' })],
        TODAY,
      ),
    ).toBeNull()
  })

  it('writes nothing when the runners agree with the catalog', () => {
    // Marking it confirmed would launder the listing's own date into something
    // that then outlives the listing correcting itself.
    expect(
      applyEditionReports(
        entry({ editions: [listing] }),
        [report({ uid: 'u1', raceDate: '2026-10-10' }), report({ uid: 'u2', raceDate: '2026-10-10' })],
        TODAY,
      ),
    ).toBeNull()
  })

  it('gives the catalog a year it never had, on one runner s word', () => {
    // The harvest only ever writes the edition still ahead, so a runner is the
    // only way the catalog learns about the ones already run, and no listing
    // is being contradicted.
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

  it('leaves a year it filled in open to the source publishing one', () => {
    const updated = applyEditionReports(
      entry({ editions: [] }),
      [report({ year: 2024, raceDate: '2024-10-13' })],
      TODAY,
    )

    // Unmarked, so `keepRunnerDate` does not defend it: nothing was
    // contradicted, so nothing needs protecting.
    expect(updated?.editions?.[0]?.runnerConfirmedAt).toBeUndefined()
  })

  it('keeps nextRaceDate true to the editions it just changed', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing], nextRaceDate: '2026-10-10' }),
      [report({ uid: 'u1', raceDate: '2026-10-11' }), report({ uid: 'u2', raceDate: '2026-10-11' })],
      TODAY,
    )

    expect(updated?.nextRaceDate).toBe('2026-10-11')
  })

  it('takes the earliest day when an event runs over a weekend', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [
        report({ uid: 'u1', raceDate: '2026-10-12' }),
        report({ uid: 'u2', raceDate: '2026-10-12' }),
        report({ uid: 'u3', raceDate: '2026-10-11' }),
        report({ uid: 'u4', raceDate: '2026-10-11' }),
      ],
      TODAY,
    )

    expect(updated?.editions?.[0]?.raceDate).toBe('2026-10-11')
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
      [report({ uid: 'u1', raceDate: '2026-10-11' }), report({ uid: 'u2', raceDate: '2026-10-11' })],
      TODAY,
    )

    // Two runners know the day they ran. They cannot vouch for a deadline that
    // has not happened, and `canAssertDates` is what reads this.
    expect(updated?.review).toBe('unreviewed')
  })
})

describe('a fee, which no source we read publishes', () => {
  it('takes one runner s word where the catalog has none', () => {
    // Nothing published is being contradicted, and the alternative is a
    // catalog that holds a fee for about one entry in fifty.
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ uid: 'u1', raceDate: undefined, fee: 45, feeCurrency: 'EUR' })],
      TODAY,
    )

    expect(updated?.editions?.[0]).toMatchObject({ typicalFee: 45, feeCurrency: 'EUR' })
  })

  it('needs two to change a fee the catalog already holds', () => {
    const priced = { ...listing, typicalFee: 40, feeCurrency: 'EUR' }
    const one = [report({ uid: 'u1', raceDate: undefined, fee: 45, feeCurrency: 'EUR' })]

    expect(applyEditionReports(entry({ editions: [priced] }), one, TODAY)).toBeNull()

    const two = [...one, report({ uid: 'u2', raceDate: undefined, fee: 45, feeCurrency: 'EUR' })]
    expect(
      applyEditionReports(entry({ editions: [priced] }), two, TODAY)?.editions?.[0],
    ).toMatchObject({ typicalFee: 45, feeCurrency: 'EUR' })
  })

  it('does not read a fee without its currency', () => {
    expect(
      applyEditionReports(
        entry({ editions: [listing] }),
        [report({ uid: 'u1', raceDate: undefined, fee: 45 })],
        TODAY,
      ),
    ).toBeNull()
  })

  it('does not call two different currencies agreement', () => {
    expect(
      applyEditionReports(
        entry({ editions: [{ ...listing, typicalFee: 40, feeCurrency: 'EUR' }] }),
        [
          report({ uid: 'u1', raceDate: undefined, fee: 45, feeCurrency: 'EUR' }),
          report({ uid: 'u2', raceDate: undefined, fee: 45, feeCurrency: 'GBP' }),
        ],
        TODAY,
      ),
    ).toBeNull()
  })

  it('writes nothing when the runners agree with the catalog', () => {
    const priced = { ...listing, typicalFee: 45, feeCurrency: 'EUR' }
    expect(
      applyEditionReports(
        entry({ editions: [priced] }),
        [
          report({ uid: 'u1', raceDate: undefined, fee: 45, feeCurrency: 'EUR' }),
          report({ uid: 'u2', raceDate: undefined, fee: 45, feeCurrency: 'EUR' }),
        ],
        TODAY,
      ),
    ).toBeNull()
  })

  it('carries a fee into a year the catalog never had', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ uid: 'u1', year: 2024, raceDate: '2024-10-13', fee: 38, feeCurrency: 'EUR' })],
      TODAY,
    )

    expect(updated?.editions?.[0]).toMatchObject({
      year: 2024,
      raceDate: '2024-10-13',
      typicalFee: 38,
      feeCurrency: 'EUR',
      source: 'runners',
    })
  })

  it('does not mark the date when only the fee changed', () => {
    const updated = applyEditionReports(
      entry({ editions: [listing] }),
      [report({ uid: 'u1', raceDate: undefined, fee: 45, feeCurrency: 'EUR' })],
      TODAY,
    )

    // `runnerConfirmedAt` is about the day, and no runner overruled one here.
    expect(updated?.editions?.[0]?.runnerConfirmedAt).toBeUndefined()
    expect(updated?.editions?.[0]?.raceDate).toBe('2026-10-10')
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
