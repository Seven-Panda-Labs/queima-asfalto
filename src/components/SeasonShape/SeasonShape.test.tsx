import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import { SeasonShape } from './SeasonShape'

afterEach(cleanup)

function event(overrides: Partial<Event> & Pick<Event, 'id' | 'date'>): Event {
  return {
    userId: 'u1',
    name: overrides.id,
    realDistance: 42.195,
    eventType: 'km_42_2',
    location: 'Lisboa',
    status: 'planned',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Event
}

describe('SeasonShape', () => {
  it('shows every month, so an empty April is as visible as a booked one', () => {
    render(
      <SeasonShape
        events={[event({ id: 'Maratona de Lisboa', date: new Date('2027-10-11') })]}
        year={2027}
        years={[2026, 2027]}
        anchorRaceIds={new Set()}
        onYear={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(12)
    expect(screen.getByText('Maratona de Lisboa')).toBeInTheDocument()
    // Eleven months with nothing in them, which is the point of the section.
    expect(screen.getAllByText('nada')).toHaveLength(11)
  })

  it('shows only the year being planned, and lets it be changed', () => {
    const onYear = vi.fn()
    render(
      <SeasonShape
        events={[
          event({ id: 'this-year', date: new Date('2027-10-11') }),
          event({ id: 'next-year', date: new Date('2028-10-09') }),
        ]}
        year={2027}
        years={[2027, 2028]}
        anchorRaceIds={new Set()}
        onYear={onYear}
      />,
    )

    expect(screen.getByText('this-year')).toBeInTheDocument()
    expect(screen.queryByText('next-year')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Ano da época/), { target: { value: '2028' } })
    expect(onYear).toHaveBeenCalledWith(2028)
  })

  it('marks the anchor, because everything else is arranged around it', () => {
    render(
      <SeasonShape
        events={[event({ id: 'Berlin', date: new Date('2027-09-26'), raceId: 'race-anchor' })]}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set(['race-anchor'])}
        onYear={vi.fn()}
      />,
    )

    const september = screen.getAllByRole('listitem')[8]!
    expect(within(september).getByText('Âncora')).toBeInTheDocument()
  })
})
