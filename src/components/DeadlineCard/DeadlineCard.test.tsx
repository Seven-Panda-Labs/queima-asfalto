import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BucketListItem } from '../../types/BucketListItem'
import type { RaceEntry } from '../../types/RaceEntry'
import { DeadlineCard } from './DeadlineCard'

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

const NOW = new Date()
const inDays = (count: number) => new Date(NOW.getTime() + count * 24 * 60 * 60 * 1000)

function item(id: string, name: string): BucketListItem {
  return {
    id,
    userId: 'user-1',
    name,
    location: 'London',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function entry(overrides: Partial<RaceEntry> & Pick<RaceEntry, 'bucketListItemId'>): RaceEntry {
  return {
    id: `entry-${overrides.bucketListItemId}`,
    userId: 'user-1',
    raceId: 'race-1',
    year: 2027,
    raceDateConfirmed: false,
    entryMethod: 'lottery',
    entryStatus: 'watching',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

afterEach(cleanup)

describe('DeadlineCard', () => {
  it('is absent when nothing needs doing', () => {
    const { container } = render(
      <DeadlineCard
        items={[item('w1', 'London Marathon')]}
        entries={[entry({ bucketListItemId: 'w1', registrationOpensAt: inDays(90) })]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('is absent for an empty bucket list', () => {
    const { container } = render(<DeadlineCard items={[]} entries={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names the most urgent race when a gate is closing', () => {
    render(
      <DeadlineCard
        items={[item('w1', 'London Marathon')]}
        entries={[entry({ bucketListItemId: 'w1', registrationClosesAt: inDays(5) })]}
      />,
    )
    expect(screen.getByText('London Marathon')).toBeInTheDocument()
  })

  it('counts the rest rather than listing them', () => {
    render(
      <DeadlineCard
        items={[item('w1', 'London Marathon'), item('w2', 'Valencia Half Marathon')]}
        entries={[
          entry({ bucketListItemId: 'w1', registrationClosesAt: inDays(3) }),
          entry({ bucketListItemId: 'w2', registrationClosesAt: inDays(9) }),
        ]}
      />,
    )
    expect(screen.getByText('London Marathon')).toBeInTheDocument()
    expect(screen.getByText('e mais 1')).toBeInTheDocument()
    expect(screen.queryByText('Valencia Half Marathon')).not.toBeInTheDocument()
  })
})
