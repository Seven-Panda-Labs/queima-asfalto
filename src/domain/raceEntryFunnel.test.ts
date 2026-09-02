import { describe, expect, it } from 'vitest'
import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry, EntryStatus } from '../types/RaceEntry'
import {
  buildRaceEntryFunnel,
  funnelGroupFor,
  nextDateFor,
  type FunnelRow,
} from './raceEntryFunnel'

const TODAY = new Date('2026-09-02')

function item(overrides: Partial<BucketListItem> & Pick<BucketListItem, 'id'>): BucketListItem {
  return {
    userId: 'user-1',
    name: overrides.id,
    location: 'Berlin',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function entry(overrides: Partial<RaceEntry> = {}): RaceEntry {
  return {
    id: 'entry-1',
    userId: 'user-1',
    raceId: 'race-1',
    bucketListItemId: 'wish',
    year: 2027,
    raceDateConfirmed: false,
    entryMethod: 'lottery',
    entryStatus: 'watching',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function row(entryOverrides: Partial<RaceEntry> | null, itemOverrides = {}): FunnelRow {
  return {
    item: item({ id: 'wish', ...itemOverrides }),
    entry: entryOverrides === null ? null : entry(entryOverrides),
  }
}

const days = (count: number) =>
  new Date(TODAY.getTime() + count * 24 * 60 * 60 * 1000)

describe('funnelGroupFor', () => {
  it('calls a wish with no attempt a dream', () => {
    expect(funnelGroupFor(row(null), TODAY)).toBe('dream')
  })

  it('calls an attempt with no dates a dream too, because there is nothing to act on', () => {
    expect(funnelGroupFor(row({}), TODAY)).toBe('dream')
  })

  it('waits while the gate is still shut', () => {
    expect(funnelGroupFor(row({ registrationOpensAt: days(30) }), TODAY)).toBe('watching')
  })

  it('asks for action the day the gate opens', () => {
    expect(funnelGroupFor(row({ registrationOpensAt: TODAY }), TODAY)).toBe('action_needed')
    expect(funnelGroupFor(row({ registrationOpensAt: days(-3) }), TODAY)).toBe('action_needed')
  })

  it('asks for action a fortnight before the gate shuts', () => {
    expect(funnelGroupFor(row({ registrationClosesAt: days(14) }), TODAY)).toBe('action_needed')
    expect(funnelGroupFor(row({ registrationClosesAt: days(15) }), TODAY)).toBe('dream')
  })

  it('calls a closed gate missed, whatever the status still says', () => {
    expect(
      funnelGroupFor(row({ entryStatus: 'watching', registrationClosesAt: days(-1) }), TODAY),
    ).toBe('missed')
  })

  it('puts a place won and not yet secured at the top of the list', () => {
    // The worst failure in the funnel: losing a place that was already yours.
    expect(funnelGroupFor(row({ entryStatus: 'accepted' }), TODAY)).toBe('action_needed')
  })

  it('reads the terminal statuses as they are', () => {
    const cases: [EntryStatus, string][] = [
      ['applied', 'applied'],
      ['registered', 'in'],
      ['rejected', 'missed'],
      ['declined', 'missed'],
      ['missed', 'missed'],
    ]
    for (const [status, expected] of cases) {
      expect(funnelGroupFor(row({ entryStatus: status }), TODAY)).toBe(expected)
    }
  })
})

describe('buildRaceEntryFunnel', () => {
  it('keeps every wish, with or without an attempt', () => {
    const groups = buildRaceEntryFunnel(
      [item({ id: 'wish' }), item({ id: 'dream-only' })],
      [entry({ bucketListItemId: 'wish', entryStatus: 'applied' })],
      TODAY,
    )

    const byKey = Object.fromEntries(groups.map((group) => [group.key, group.rows]))
    expect(byKey.applied!.map((r) => r.item.id)).toEqual(['wish'])
    expect(byKey.dream!.map((r) => r.item.id)).toEqual(['dream-only'])
  })

  it('takes the latest year as the current attempt', () => {
    const groups = buildRaceEntryFunnel(
      [item({ id: 'wish' })],
      [
        entry({ id: 'old', year: 2026, entryStatus: 'rejected' }),
        entry({ id: 'new', year: 2027, entryStatus: 'applied' }),
      ],
      TODAY,
    )

    const applied = groups.find((group) => group.key === 'applied')!
    expect(applied.rows[0]?.entry?.id).toBe('new')
  })

  it('ignores an attempt whose wish is gone', () => {
    const groups = buildRaceEntryFunnel([], [entry({ bucketListItemId: 'deleted' })], TODAY)
    expect(groups.every((group) => group.rows.length === 0)).toBe(true)
  })

  it('sorts by the next date still ahead, not by one that has passed', () => {
    const groups = buildRaceEntryFunnel(
      [item({ id: 'closing' }), item({ id: 'securing' })],
      [
        // Opened two days ago and closes in nine.
        entry({
          id: 'e1',
          bucketListItemId: 'closing',
          registrationOpensAt: days(-2),
          registrationClosesAt: days(9),
        }),
        entry({ id: 'e2', bucketListItemId: 'securing', entryStatus: 'accepted', placeConfirmByAt: days(6) }),
      ],
      TODAY,
    )

    const actionNeeded = groups.find((group) => group.key === 'action_needed')!
    expect(actionNeeded.rows.map((r) => r.item.id)).toEqual(['securing', 'closing'])
  })

  it('puts anchors first, then the nearest date', () => {
    const groups = buildRaceEntryFunnel(
      [
        item({ id: 'soon' }),
        item({ id: 'later' }),
        item({ id: 'anchor', isAnchor: true }),
      ],
      [
        entry({ id: 'e1', bucketListItemId: 'soon', registrationOpensAt: days(10) }),
        entry({ id: 'e2', bucketListItemId: 'later', registrationOpensAt: days(200) }),
        entry({ id: 'e3', bucketListItemId: 'anchor', registrationOpensAt: days(120) }),
      ],
      TODAY,
    )

    const watching = groups.find((group) => group.key === 'watching')!
    expect(watching.rows.map((r) => r.item.id)).toEqual(['anchor', 'soon', 'later'])
  })

  it('returns every group, in order, even when empty', () => {
    const groups = buildRaceEntryFunnel([], [], TODAY)
    expect(groups.map((group) => group.key)).toEqual([
      'action_needed',
      'applied',
      'watching',
      'in',
      'dream',
      'missed',
    ])
  })
})

describe('nextDateFor', () => {
  it('is the soonest thing the entry is waiting on', () => {
    const result = nextDateFor(
      entry({
        raceDate: days(300),
        registrationOpensAt: days(30),
        lotteryDrawAt: days(60),
      }),
    )
    expect(result?.toISOString()).toBe(days(30).toISOString())
  })

  it('prefers a deadline to secure a place over the race itself', () => {
    const result = nextDateFor(entry({ raceDate: days(300), placeConfirmByAt: days(5) }))
    expect(result?.toISOString()).toBe(days(5).toISOString())
  })

  it('ignores a date that has already passed', () => {
    // The bug this caught: a window that opened last week sorted ahead of a
    // window closing next week, because the past date was the soonest.
    const result = nextDateFor(
      entry({ registrationOpensAt: days(-2), registrationClosesAt: days(9) }),
      TODAY,
    )
    expect(result?.toISOString()).toBe(days(9).toISOString())
  })

  it('falls back to the most recent one when every date has passed', () => {
    const result = nextDateFor(
      entry({ registrationOpensAt: days(-30), registrationClosesAt: days(-2) }),
      TODAY,
    )
    expect(result?.toISOString()).toBe(days(-2).toISOString())
  })

  it('is null when there is nothing to wait for', () => {
    expect(nextDateFor(null)).toBeNull()
    expect(nextDateFor(entry({}))).toBeNull()
  })
})
