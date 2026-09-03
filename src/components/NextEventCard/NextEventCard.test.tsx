import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { Event } from '../../types/Event'
import { NextEventCard } from './NextEventCard'

afterEach(() => {
  cleanup()
})

const event = {
  id: 'next',
  name: 'Tierparklauf',
  date: new Date('2027-01-01'),
  realDistance: 10,
  status: 'confirmed',
  eventType: 'km_10',
  location: 'Berlin',
} as Event

function renderCard(
  target?: Parameters<typeof NextEventCard>[0]['target'],
  projection?: Parameters<typeof NextEventCard>[0]['projection'],
) {
  render(
    <MemoryRouter>
      <NextEventCard event={event} target={target} projection={projection} />
    </MemoryRouter>,
  )
}

describe('NextEventCard', () => {
  it('shows the race without a target when the course is new', () => {
    renderCard(null)
    expect(screen.getByText('Tierparklauf')).toBeInTheDocument()
    expect(screen.queryByText(/A bater/)).not.toBeInTheDocument()
  })

  it('shows the time and the pace to beat on a course already run', () => {
    renderCard({ targetSeconds: 1540, paceSeconds: 308, runs: 15 })
    expect(screen.getByText(/A bater: 25:40/)).toBeInTheDocument()
    expect(screen.getByText(/5:08/)).toBeInTheDocument()
  })

  it('says how many times the course has been run', () => {
    renderCard({ targetSeconds: 1540, paceSeconds: 308, runs: 15 })
    expect(screen.getByText('15 vezes aqui')).toBeInTheDocument()
  })

  it('says it in the singular for a course run once', () => {
    renderCard({ targetSeconds: 1540, paceSeconds: 308, runs: 1 })
    expect(screen.getByText('1 vez aqui')).toBeInTheDocument()
  })

  it('shows the projection when the course has never been run', () => {
    renderCard(null, { predictedSeconds: 2830, paceSeconds: 283, fromBuildUp: true })
    expect(screen.getByText(/Previsão: 47:10/)).toBeInTheDocument()
    expect(screen.getByText('da prova de preparação')).toBeInTheDocument()
  })

  it('keeps the time to beat over the projection: the same course says more', () => {
    renderCard(
      { targetSeconds: 1540, paceSeconds: 308, runs: 15 },
      { predictedSeconds: 2830, paceSeconds: 283, fromBuildUp: true },
    )
    expect(screen.getByText(/A bater: 25:40/)).toBeInTheDocument()
    expect(screen.queryByText(/Previsão/)).not.toBeInTheDocument()
  })

  it('still renders the empty hero with no event at all', () => {
    render(
      <MemoryRouter>
        <NextEventCard event={null} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Tierparklauf')).not.toBeInTheDocument()
  })
})

describe('NextEventCard and the season target', () => {
  const anchor = {
    id: 'anchor',
    name: 'Maratona do Porto',
    date: new Date('2027-02-01'),
    realDistance: 42.195,
    status: 'planned',
    eventType: 'km_42_2',
    location: 'Porto',
  } as Event

  const last = {
    id: 'last',
    name: 'Meia de Cascais',
    date: new Date('2026-08-16'),
    realDistance: 21.0975,
    status: 'completed',
    eventType: 'km_21_1',
    location: 'Cascais',
    time: '01:38:20',
  } as Event

  it('draws the road from the last race to the target', () => {
    render(
      <MemoryRouter>
        <NextEventCard event={event} anchor={anchor} last={last} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Última')).toBeInTheDocument()
    expect(screen.getByText('A seguir')).toBeInTheDocument()
    expect(screen.getByText('Prova objetivo')).toBeInTheDocument()
    // The last race carries its distance and its time, which is what makes it
    // worth a stop, and the target says how far it is in both senses.
    // Portuguese writes 21,0975 km as 21,1 km, decimal comma included.
    expect(screen.getByText('21,1 km · 01:38:20')).toBeInTheDocument()
    expect(screen.getByText(/42,2 km · /)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Maratona do Porto/ })).toHaveAttribute(
      'href',
      '/eventos/anchor',
    )
  })

  it('starts the road at the next race when nothing was run yet', () => {
    render(
      <MemoryRouter>
        <NextEventCard event={event} anchor={anchor} />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Última')).not.toBeInTheDocument()
    expect(screen.getByText('Prova objetivo')).toBeInTheDocument()
  })

  it('gives the whole hero to the target on the last stretch', () => {
    render(
      <MemoryRouter>
        <NextEventCard event={event} isAnchor last={last} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Prova objetivo')).toBeInTheDocument()
    // One of the coach's lines, and no road: there is nowhere further to point.
    expect(screen.getByText(/treinaste|a sério|Vamos a isto|Sem desculpas/)).toBeInTheDocument()
    expect(screen.queryByText('A seguir')).not.toBeInTheDocument()
  })

  it('stays as it was without an anchor', () => {
    render(
      <MemoryRouter>
        <NextEventCard event={event} last={last} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Próximo evento')).toBeInTheDocument()
    expect(screen.queryByText('Prova objetivo')).not.toBeInTheDocument()
    expect(screen.queryByText('A seguir')).not.toBeInTheDocument()
  })
})
