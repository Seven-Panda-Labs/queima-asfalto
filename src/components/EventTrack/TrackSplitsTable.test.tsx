import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { TrackSplit } from '../../domain/activityTrack'
import { TrackSplitsTable } from './TrackSplitsTable'

afterEach(() => {
  cleanup()
})

function split(
  index: number,
  paceSecondsPerKm: number,
  overrides: Partial<TrackSplit> = {},
): TrackSplit {
  return {
    index,
    distanceMeters: 1000,
    durationSeconds: paceSecondsPerKm,
    paceSecondsPerKm,
    partial: false,
    ...overrides,
  }
}

// The sample parkrun: 5:07, 5:13, 5:28, 5:21, then 954 m.
const sampleSplits = [
  split(1, 307),
  split(2, 313),
  split(3, 328),
  split(4, 321),
  split(5, 326, { distanceMeters: 954, durationSeconds: 311, partial: true }),
]

describe('TrackSplitsTable', () => {
  it('renders one row per split', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    expect(screen.getAllByRole('row')).toHaveLength(sampleSplits.length + 1)
  })

  it('shows the pace of each kilometre', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    // A full kilometre's split time is its pace, so the value appears in both columns.
    expect(screen.getAllByText('5:07')).toHaveLength(2)
    expect(screen.getAllByText('5:28')).toHaveLength(2)
  })

  it('separates the partial split time from its extrapolated pace', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    const partialRow = screen.getByText('0.95 km').closest('tr')!
    expect(within(partialRow).getByText('5:11')).toBeInTheDocument()
    expect(within(partialRow).getByText('5:26')).toBeInTheDocument()
  })

  it('labels the fastest and the slowest kilometre', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    expect(screen.getByText('mais rápido')).toBeInTheDocument()
    expect(screen.getByText('mais lento')).toBeInTheDocument()
  })

  it('names the trailing partial split by its distance, not by a km number', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    expect(screen.getByText('0.95 km')).toBeInTheDocument()
  })

  it('leaves out the heart rate column for a file without it', () => {
    render(<TrackSplitsTable splits={sampleSplits} showHeartRate={false} />)
    const header = screen.getAllByRole('row')[0]
    expect(within(header).queryByText('FC')).not.toBeInTheDocument()
    expect(within(header).getAllByRole('columnheader')).toHaveLength(3)
  })

  it('adds the heart rate column when the file carried it', () => {
    render(
      <TrackSplitsTable
        splits={[split(1, 307, { averageHeartRate: 141 })]}
        showHeartRate
      />,
    )
    expect(screen.getByText('FC')).toBeInTheDocument()
    expect(screen.getByText('141')).toBeInTheDocument()
  })

  it('renders nothing at all without splits', () => {
    const { container } = render(<TrackSplitsTable splits={[]} showHeartRate={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
