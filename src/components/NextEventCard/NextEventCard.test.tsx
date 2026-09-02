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
