import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RoutePoint } from '../../domain/activityTrack'

// Leaflet needs a laid-out DOM that jsdom does not give it, so the map parts are
// stubbed and what the component decides to render is asserted instead.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => <div data-testid="marker" />,
  Polyline: () => <div data-testid="route" />,
  useMap: () => ({ fitBounds: vi.fn() }),
}))

const { LocationMap } = await import('./EventLocationMap')

const point = { location: 'Berlin Tiergarten', locationLat: 52.51, locationLng: 13.36 }

const route: RoutePoint[] = [
  { lat: 52.514, lon: 13.35 },
  { lat: 52.515, lon: 13.36 },
  { lat: 52.516, lon: 13.37 },
]

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('LocationMap', () => {
  it('shows the venue pin when there is no route to draw', () => {
    render(<LocationMap point={point} />)

    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(screen.queryByTestId('route')).not.toBeInTheDocument()
  })

  it('drops the pin once a route is drawn', () => {
    // The pin is a geocoded place name and lands beside the course, or outside
    // the frame the route fits to.
    render(<LocationMap point={point} route={route} />)

    expect(screen.getByTestId('route')).toBeInTheDocument()
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('keeps the pin for a route too short to be a course', () => {
    render(<LocationMap point={point} route={[{ lat: 52.514, lon: 13.35 }]} />)

    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(screen.queryByTestId('route')).not.toBeInTheDocument()
  })
})
