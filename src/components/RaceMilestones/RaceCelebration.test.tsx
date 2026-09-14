import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceMilestone } from '../../domain/raceMilestones'
import { RaceCelebration } from './RaceCelebration'
import { makeEvent } from '../../utils/analytics/testFixtures'

const fireConfetti = vi.hoisted(() => vi.fn())
vi.mock('./confetti', () => ({ fireConfetti }))

afterEach(() => {
  cleanup()
  fireConfetti.mockClear()
})

const event = makeEvent({
  id: 'e1',
  date: new Date(2026, 8, 12),
  eventType: 'km_10',
  name: 'Tierparklauf',
  time: '00:53:22',
  pace: '5:20',
})

const record: RaceMilestone = {
  kind: 'personal_record',
  id: 'record',
  weight: 100,
  eventType: 'km_10',
  improvementSeconds: 21,
  superseded: null,
}

const count: RaceMilestone = {
  kind: 'race_count',
  id: 'race-count-10',
  weight: 40,
  ordinal: 10,
}

function renderPanel(milestones: RaceMilestone[], onDismiss = vi.fn()) {
  render(
    <MemoryRouter>
      <RaceCelebration
        event={event}
        milestones={milestones}
        returnTo="/eventos"
        onDismiss={onDismiss}
      />
    </MemoryRouter>,
  )
  return onDismiss
}

describe('the celebration panel', () => {
  it('shows a card for every mark', () => {
    renderPanel([record, count])
    expect(screen.getByText('00:53:22')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('announces itself rather than stealing focus', () => {
    renderPanel([record])
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('throws the full party for a record and a small one for a round number', () => {
    renderPanel([record])
    expect(fireConfetti).toHaveBeenCalledWith('full')

    cleanup()
    fireConfetti.mockClear()
    renderPanel([count])
    expect(fireConfetti).toHaveBeenCalledWith('light')
  })

  it('links to the race that took a mark away', () => {
    renderPanel([
      {
        ...record,
        superseded: { eventId: 'e2', eventName: 'Volkslauf', date: new Date(2026, 10, 1) },
      },
    ])
    expect(screen.getByRole('link', { name: /Volkslauf/ })).toHaveAttribute(
      'href',
      '/eventos/e2?returnTo=%2Feventos',
    )
  })

  it('renders nothing when the race changed nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <RaceCelebration event={event} milestones={[]} returnTo="/eventos" onDismiss={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
