import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import type { EventTrack } from '../../types/EventTrack'
import { TrackResultSuggestion } from './TrackResultSuggestion'

afterEach(() => {
  cleanup()
})

const event = {
  id: 'event-1',
  realDistance: 5,
} as Event

const track = {
  id: 'current',
  eventId: 'event-1',
  elapsedSeconds: 1580,
  distanceMeters: 4954,
} as EventTrack

function renderSuggestion(currentTime: string, overrides: Partial<EventTrack> = {}) {
  const onApplyTime = vi.fn()
  render(
    <TrackResultSuggestion
      track={{ ...track, ...overrides }}
      event={event}
      currentTime={currentTime}
      onApplyTime={onApplyTime}
    />,
  )
  return onApplyTime
}

describe('with no time recorded', () => {
  it('offers the measured time and applies it on one click', () => {
    const onApplyTime = renderSuggestion('')

    fireEvent.click(screen.getByRole('button', { name: 'Usar este tempo' }))
    expect(onApplyTime).toHaveBeenCalledWith('00:26:20')
  })
})

describe('with a different time already recorded', () => {
  it('does not offer to fill, only to replace', () => {
    renderSuggestion('00:26:13')

    expect(screen.queryByRole('button', { name: 'Usar este tempo' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Substituir pelo tempo medido' }),
    ).toBeInTheDocument()
  })

  it('shows the difference against the recorded time', () => {
    renderSuggestion('00:26:13')
    expect(screen.getByText(/00:26:13/)).toBeInTheDocument()
    expect(screen.getByText(/\+0:07/)).toBeInTheDocument()
  })

  it('never replaces without a confirmation', () => {
    const onApplyTime = renderSuggestion('00:26:13')

    fireEvent.click(screen.getByRole('button', { name: 'Substituir pelo tempo medido' }))
    expect(onApplyTime).not.toHaveBeenCalled()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps the recorded time when the confirmation is dismissed', () => {
    const onApplyTime = renderSuggestion('00:26:13')

    fireEvent.click(screen.getByRole('button', { name: 'Substituir pelo tempo medido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onApplyTime).not.toHaveBeenCalled()
  })

  it('applies only once the replacement is confirmed', () => {
    const onApplyTime = renderSuggestion('00:26:13')

    fireEvent.click(screen.getByRole('button', { name: 'Substituir pelo tempo medido' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Substituir pelo tempo medido' }),
    )
    expect(onApplyTime).toHaveBeenCalledWith('00:26:20')
  })
})

describe('when the times agree', () => {
  it('asks for nothing', () => {
    renderSuggestion('00:26:20')

    expect(screen.queryByRole('button', { name: 'Usar este tempo' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Substituir pelo tempo medido' }),
    ).not.toBeInTheDocument()
  })
})

describe('distance check', () => {
  it('stays quiet for the small deviation a normal GPS track has', () => {
    renderSuggestion('')
    expect(screen.queryByText(/distância oficial/)).not.toBeInTheDocument()
  })

  it('warns when the file cannot plausibly be this race', () => {
    renderSuggestion('', { distanceMeters: 10000 })
    expect(screen.getByText(/distância oficial/)).toBeInTheDocument()
  })
})
