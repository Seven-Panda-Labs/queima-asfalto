import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecomputeTracksReport } from '../../services/admin'
import { AdminMaintenance } from './AdminMaintenance'

const recomputeTracksForAdmin = vi.fn()

vi.mock('../../services/admin', () => ({
  recomputeTracksForAdmin: (cursor?: string) => recomputeTracksForAdmin(cursor),
}))

// The tabs need a router, and this file is about the sweep.
vi.mock('./AdminTabs', () => ({ AdminTabs: () => null }))

function report(overrides: Partial<RecomputeTracksReport> = {}): RecomputeTracksReport {
  return { examined: 0, recomputed: 0, withoutTrack: 0, failed: [], ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('AdminMaintenance', () => {
  it('follows the cursor until the sweep is done', async () => {
    recomputeTracksForAdmin
      .mockResolvedValueOnce(report({ examined: 25, recomputed: 20, cursor: 'event-25' }))
      .mockResolvedValueOnce(report({ examined: 25, recomputed: 18, cursor: 'event-50' }))
      .mockResolvedValueOnce(report({ examined: 6, recomputed: 5 }))

    render(<AdminMaintenance />)
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular resumos' }))

    await waitFor(() => expect(recomputeTracksForAdmin).toHaveBeenCalledTimes(3))
    // The cursor from each batch is what the next one starts after.
    expect(recomputeTracksForAdmin).toHaveBeenNthCalledWith(1, undefined)
    expect(recomputeTracksForAdmin).toHaveBeenNthCalledWith(2, 'event-25')
    expect(recomputeTracksForAdmin).toHaveBeenNthCalledWith(3, 'event-50')
  })

  it('adds the batches up rather than showing only the last', async () => {
    recomputeTracksForAdmin
      .mockResolvedValueOnce(report({ examined: 25, recomputed: 20, cursor: 'event-25' }))
      .mockResolvedValueOnce(report({ examined: 6, recomputed: 5 }))

    render(<AdminMaintenance />)
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular resumos' }))

    await screen.findByText('Concluído. Os ficheiros de todas as contas foram lidos de novo.')
    expect(screen.getByText('31')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('names the files it could not read', async () => {
    recomputeTracksForAdmin.mockResolvedValueOnce(
      report({ examined: 2, failed: [{ eventId: 'event-broken', reason: 'malformed_xml' }] }),
    )

    render(<AdminMaintenance />)
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular resumos' }))

    expect(await screen.findByText(/event-broken: malformed_xml/)).toBeInTheDocument()
  })

  it('surfaces a failed call instead of looping', async () => {
    recomputeTracksForAdmin.mockRejectedValueOnce(new Error('permission-denied'))

    render(<AdminMaintenance />)
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular resumos' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('permission-denied')
    expect(recomputeTracksForAdmin).toHaveBeenCalledTimes(1)
  })
})
