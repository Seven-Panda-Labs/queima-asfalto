import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import { SeasonTimeline } from './SeasonTimeline'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

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

const SEASON = [
  event({ id: 'Prova X', date: new Date('2027-01-10T12:00:00'), eventType: 'km_5' }),
  event({ id: 'Prova Y', date: new Date('2027-03-23T12:00:00'), eventType: 'km_10' }),
  event({
    id: 'Prova Z',
    date: new Date('2027-04-30T12:00:00'),
    eventType: 'km_21_1',
    raceId: 'race-anchor',
  }),
]

describe('SeasonTimeline', () => {
  it('reads as a path to the anchor', () => {
    render(
      <SeasonTimeline
        events={SEASON}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set(['race-anchor'])}
        onYear={vi.fn()}
      />,
    )

    const leg = screen.getAllByRole('listitem')[0]!
    expect(leg.textContent).toMatch(/Prova X.*Prova Y.*Prova Z/)
    expect(screen.getByLabelText('Âncora')).toBeInTheDocument()
  })

  it('makes the gap between two races a search for those dates', () => {
    render(
      <SeasonTimeline
        events={SEASON}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set(['race-anchor'])}
        onYear={vi.fn()}
      />,
    )

    // The days between the two, not the days of the two.
    expect(screen.getByLabelText('Encontrar uma prova antes de Prova Y')).toHaveAttribute(
      'href',
      '/planeamento/descobrir?from=2027-01-11&to=2027-03-22',
    )
  })

  it('says how long each gap is, because that is what the connector is for', () => {
    render(
      <SeasonTimeline
        events={SEASON}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set(['race-anchor'])}
        onYear={vi.fn()}
      />,
    )

    // Ten weeks between the 5 km and the 10 km, five before the anchor.
    expect(screen.getByText('10 sem')).toBeInTheDocument()
    expect(screen.getByText('5 sem')).toBeInTheDocument()
  })

  it('says nothing about a gap with an open end', () => {
    render(
      <SeasonTimeline
        events={[SEASON[0]!]}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set()}
        onYear={vi.fn()}
      />,
    )

    // Nothing before the first race and nothing after the last: there is no
    // span to measure, only a year to search.
    expect(screen.queryByText(/sem$/)).not.toBeInTheDocument()
  })

  it('opens the year when there is nothing before the first race', () => {
    render(
      <SeasonTimeline
        events={SEASON}
        year={2027}
        years={[2027]}
        anchorRaceIds={new Set(['race-anchor'])}
        onYear={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Encontrar uma prova antes de Prova X')).toHaveAttribute(
      'href',
      '/planeamento/descobrir?from=2027-01-01&to=2027-01-09',
    )
  })

  it('offers the whole year when the season is empty', () => {
    render(
      <SeasonTimeline events={[]} year={2027} years={[2027]} anchorRaceIds={new Set()} onYear={vi.fn()} />,
    )

    expect(screen.getByLabelText('Encontrar provas para esta época')).toHaveAttribute(
      'href',
      '/planeamento/descobrir?from=2027-01-01&to=2027-12-31',
    )
  })

  it('says what is missing when nothing is an anchor', () => {
    render(
      <SeasonTimeline events={SEASON} year={2027} years={[2027]} anchorRaceIds={new Set()} onYear={vi.fn()} />,
    )

    expect(screen.getByText(/Nenhuma destas está marcada como âncora/)).toBeInTheDocument()
  })

  it('changes the season being planned', () => {
    const onYear = vi.fn()
    render(
      <SeasonTimeline
        events={SEASON}
        year={2027}
        years={[2027, 2028]}
        anchorRaceIds={new Set()}
        onYear={onYear}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Ano da época/), { target: { value: '2028' } })
    expect(onYear).toHaveBeenCalledWith(2028)
  })
})
