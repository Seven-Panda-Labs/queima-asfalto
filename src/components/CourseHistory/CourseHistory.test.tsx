import '@testing-library/jest-dom/vitest'
import { cleanup, render as renderDom, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Event } from '../../types/Event'
import { buildCourseComparison } from '../../utils/analytics/course'
import { CourseHistory } from './CourseHistory'

afterEach(() => {
  cleanup()
})

function render(ui: ReactElement) {
  renderDom(<MemoryRouter>{ui}</MemoryRouter>)
}

function race(id: string, date: string, time: string): Event {
  return {
    id,
    name: 'Parkrun Hasenheide',
    date: new Date(date),
    realDistance: 5,
    time,
    status: 'completed',
    eventType: 'km_5',
  } as Event
}

function upcoming(id: string, date: string): Event {
  return {
    id,
    name: 'Parkrun Hasenheide',
    date: new Date(date),
    realDistance: 5,
    status: 'confirmed',
    eventType: 'km_5',
  } as Event
}

// 5:20, then 4:57, then 5:27 a kilometre.
const runs = [
  race('a', '2021-10-01', '00:26:40'),
  race('b', '2023-01-14', '00:24:45'),
  race('c', '2026-05-02', '00:27:15'),
]

function renderFor(id: string) {
  const event = runs.find((run) => run.id === id)!
  render(<CourseHistory returnTo="/analise" comparison={buildCourseComparison(event, runs)!} />)
}

describe('CourseHistory', () => {
  it('says how many times the course has been run', () => {
    renderFor('c')
    expect(screen.getByText('Já o correste 3 vezes.')).toBeInTheDocument()
  })

  it('says it in the singular when the course was run once before', () => {
    const ahead = upcoming('next', '2027-01-01')
    render(<CourseHistory returnTo="/analise" comparison={buildCourseComparison(ahead, [runs[0], ahead])!} />)
    expect(screen.getByText('Já o correste uma vez.')).toBeInTheDocument()
  })

  it('ranks this run and shows the gap to the best', () => {
    renderFor('c')
    expect(screen.getByText('3ª de 3')).toBeInTheDocument()
    expect(screen.getByText('5:27/km')).toBeInTheDocument()
    // Here the previous run is also the best, so both rows carry the same pace.
    expect(screen.getAllByText('4:57/km')).toHaveLength(2)
    expect(screen.getAllByText('+0:30')).toHaveLength(2)
  })

  it('marks the best run instead of comparing it to itself', () => {
    renderFor('b')
    expect(screen.getByText('a tua melhor aqui')).toBeInTheDocument()
    expect(screen.queryByText('Melhor')).not.toBeInTheDocument()
  })

  it('has no previous row for the first running', () => {
    renderFor('a')
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
  })

  it('offers a target instead of a ranking for a race still ahead', () => {
    const ahead = upcoming('next', '2027-01-01')
    render(<CourseHistory returnTo="/analise" comparison={buildCourseComparison(ahead, [...runs, ahead])!} />)

    // Best pace here is 4:57, so five kilometres of it is 24:45.
    expect(screen.getByText('A bater: 24:45 · 4:57/km')).toBeInTheDocument()
    expect(screen.getByText('24:45 · 4:57/km')).toBeInTheDocument()
    expect(screen.queryByText('Esta vez')).not.toBeInTheDocument()
  })

  it('links each past running to its own page, but not the race being viewed', () => {
    renderFor('c')
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toEqual(['/eventos/b?returnTo=%2Fanalise', '/eventos/b?returnTo=%2Fanalise'])
  })

  it('compares against the run immediately before, not only the best', () => {
    renderFor('c')
    expect(screen.getByText('Anterior')).toBeInTheDocument()
  })
})
