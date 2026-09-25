import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Race } from '../../types/Race'
import type { RaceEntry } from '../../types/RaceEntry'
import { DeadlineCard } from './DeadlineCard'

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

const NOW = new Date()
const inDays = (count: number) => new Date(NOW.getTime() + count * 24 * 60 * 60 * 1000)

function race(id: string, name: string): Race {
  return {
    id,
    userId: 'user-1',
    name,
    location: 'London',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function entry(overrides: Partial<RaceEntry> & Pick<RaceEntry, 'raceId'>): RaceEntry {
  return {
    id: `entry-${overrides.raceId}`,
    userId: 'user-1',
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
        races={[race('r1', 'London Marathon')]}
        entries={[entry({ raceId: 'r1', registrationOpensAt: inDays(90) })]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('is absent when nobody is chasing a place', () => {
    const { container } = render(<DeadlineCard races={[]} entries={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names the most urgent race when a gate is closing', () => {
    render(
      <DeadlineCard
        races={[race('r1', 'London Marathon')]}
        entries={[entry({ raceId: 'r1', registrationClosesAt: inDays(5) })]}
      />,
    )
    expect(screen.getByText('London Marathon')).toBeInTheDocument()
  })

  it('counts the rest rather than listing them', () => {
    render(
      <DeadlineCard
        races={[race('r1', 'London Marathon'), race('r2', 'Valencia Half Marathon')]}
        entries={[
          entry({ raceId: 'r1', registrationClosesAt: inDays(3) }),
          entry({ raceId: 'r2', registrationClosesAt: inDays(9) }),
        ]}
      />,
    )
    expect(screen.getByText('London Marathon')).toBeInTheDocument()
    expect(screen.getByText('e mais 1')).toBeInTheDocument()
    expect(screen.queryByText('Valencia Half Marathon')).not.toBeInTheDocument()
  })
})
