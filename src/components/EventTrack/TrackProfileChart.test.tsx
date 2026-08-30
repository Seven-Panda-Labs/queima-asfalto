import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TrackProfilePoint } from '../../domain/activityTrack'

const chartProps = vi.fn()

// jsdom has no canvas, so the chart is stubbed and its configuration asserted instead.
vi.mock('react-chartjs-2', () => ({
  Line: (props: unknown) => {
    chartProps(props)
    return <div data-testid="chart" />
  },
}))

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ effectiveTheme: 'light' }),
}))

const { TrackProfileChart } = await import('./TrackProfileChart')

type CapturedChart = {
  data: { datasets: Array<{ label: string; yAxisID: string; fill?: boolean }> }
  options: { scales: { pace: { reverse: boolean }; elevation: { display: boolean } } }
}

function captured(): CapturedChart {
  return chartProps.mock.calls.at(-1)![0] as CapturedChart
}

function profile(count: number, withElevation: boolean): TrackProfilePoint[] {
  return Array.from({ length: count }, (_unused, index) => ({
    distanceMeters: (index + 1) * 101,
    paceSecondsPerKm: 307 + index,
    ...(withElevation ? { elevationMeters: 40 + index } : {}),
  }))
}

beforeEach(() => {
  chartProps.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('TrackProfileChart', () => {
  it('plots pace against distance', () => {
    render(<TrackProfileChart profile={profile(49, true)} />)
    const { data } = captured()
    expect(data.datasets[0].yAxisID).toBe('pace')
  })

  it('reverses the pace axis so faster reads as higher', () => {
    render(<TrackProfileChart profile={profile(49, true)} />)
    expect(captured().options.scales.pace.reverse).toBe(true)
  })

  it('fills elevation behind the pace line as context', () => {
    render(<TrackProfileChart profile={profile(49, true)} />)
    const { data, options } = captured()
    expect(data.datasets).toHaveLength(2)
    expect(data.datasets[1].fill).toBe(true)
    expect(options.scales.elevation.display).toBe(true)
  })

  it('drops the elevation axis entirely for a file without altitude', () => {
    render(<TrackProfileChart profile={profile(49, false)} />)
    const { data, options } = captured()
    expect(data.datasets).toHaveLength(1)
    expect(options.scales.elevation.display).toBe(false)
  })

  it('renders nothing when there are too few samples to say anything', () => {
    const { container } = render(<TrackProfileChart profile={profile(3, true)} />)
    expect(container).toBeEmptyDOMElement()
    expect(chartProps).not.toHaveBeenCalled()
  })
})
