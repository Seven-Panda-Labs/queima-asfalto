import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import type { EventTrack } from '../../types/EventTrack'

const uploadEventTrack = vi.fn()
const deleteEventTrack = vi.fn()
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() }

// Mocked so the module graph never reaches services/firebase, which needs env vars.
vi.mock('../../services/eventTrack', () => ({
  uploadEventTrack: (...args: unknown[]) => uploadEventTrack(...args),
  deleteEventTrack: (...args: unknown[]) => deleteEventTrack(...args),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => toast,
}))

// The chart has its own tests and needs a canvas; this suite is about the actions.
vi.mock('./TrackProfileChart', () => ({
  TrackProfileChart: () => null,
}))

const { EventTrackSection } = await import('./EventTrackSection')

const event = { id: 'event-1', realDistance: 5 } as Event

const track = {
  id: 'current',
  eventId: 'event-1',
  format: 'gpx',
  fileName: 'sample-parkrun.GPX',
  elapsedSeconds: 1580,
  distanceMeters: 4954,
  averagePaceSecondsPerKm: 319,
  elevationGainMeters: 93,
  splits: [
    { index: 1, distanceMeters: 1000, durationSeconds: 307, paceSecondsPerKm: 307, partial: false },
    { index: 2, distanceMeters: 1000, durationSeconds: 313, paceSecondsPerKm: 313, partial: false },
  ],
  route: [],
  profile: [],
} as unknown as EventTrack

function pickFile(name = 'run.gpx') {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File(['<gpx></gpx>'], name)
  fireEvent.change(input, { target: { files: [file] } })
  return file
}

beforeEach(() => {
  vi.clearAllMocks()
  uploadEventTrack.mockResolvedValue({ ok: true, track, replaced: false })
  deleteEventTrack.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
})

describe('with no track yet', () => {
  it('invites an upload and uploads the moment a file is picked', async () => {
    render(<EventTrackSection event={event} track={null} loading={false} userId="user-1" />)

    expect(screen.getByRole('button', { name: 'Carregar ficheiro' })).toBeInTheDocument()
    pickFile()

    // Nothing to lose, so picking the file is the intent.
    await waitFor(() => expect(uploadEventTrack).toHaveBeenCalledOnce())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('surfaces a rejected file instead of a toast', async () => {
    uploadEventTrack.mockResolvedValue({ ok: false, code: 'no_track_points' })
    render(<EventTrackSection event={event} track={null} loading={false} userId="user-1" />)

    pickFile()
    expect(await screen.findByRole('alert')).toHaveTextContent(/pontos com data e hora/)
  })
})

describe('with a track already attached', () => {
  it('shows what the file measured', () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)

    expect(screen.getByText('26:20')).toBeInTheDocument()
    expect(screen.getByText('4.95 km')).toBeInTheDocument()
    expect(screen.getByText('93 m')).toBeInTheDocument()
  })

  it('stays quiet about heart rate for a file that has none', () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)
    expect(screen.queryByText('FC média')).not.toBeInTheDocument()
  })

  it('summarises heart rate when the file carries it', () => {
    const withHeartRate = {
      ...track,
      heartRate: { average: 180, minimum: 72, maximum: 198 },
    } as EventTrack

    render(
      <EventTrackSection event={event} track={withHeartRate} loading={false} userId="user-1" />,
    )

    expect(screen.getByText('FC média')).toBeInTheDocument()
    expect(screen.getByText('180 bpm')).toBeInTheDocument()
    expect(screen.getByText('198 bpm')).toBeInTheDocument()
    expect(screen.getByText('72 bpm')).toBeInTheDocument()
  })

  it('never replaces a file without confirmation', async () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)

    pickFile('other.tcx')
    expect(uploadEventTrack).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('other.tcx')
  })

  it('keeps the current file when the replacement is dismissed', async () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)

    pickFile('other.tcx')
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(uploadEventTrack).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('replaces once confirmed', async () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)

    pickFile('other.tcx')
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Substituir ficheiro' }))

    await waitFor(() => expect(uploadEventTrack).toHaveBeenCalledOnce())
  })

  it('never removes a file without confirmation', async () => {
    render(<EventTrackSection event={event} track={track} loading={false} userId="user-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    expect(deleteEventTrack).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
    await waitFor(() => expect(deleteEventTrack).toHaveBeenCalledWith('event-1'))
  })
})
