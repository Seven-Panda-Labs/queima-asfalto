import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render as renderComponent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Event } from '../../types/Event'
import type { OfficialResultCandidate } from '../../../shared/officialResults'

const importResultsPdf = vi.fn()
const saveResults = vi.fn()

// Mocked so the module graph never reaches services/firebase, which needs env
// vars, and so pdfjs is never pulled into the test run.
vi.mock('../../services/resultsPdfImport', () => ({
  importResultsPdf: (...args: unknown[]) => importResultsPdf(...args),
}))

vi.mock('../../services/events', () => ({
  saveResults: (...args: unknown[]) => saveResults(...args),
}))

vi.mock('../../hooks/useUserResultsProfile', () => ({
  useUserResultsProfile: () => ({ profile: { resultLastName: 'Graumann' } }),
}))

const { ResultsPdfUpload } = await import('./ResultsPdfUpload')

const event = {
  id: 'event-1',
  date: new Date(2026, 8, 16),
  resultsUrl: 'https://www.maxfunsports.com/result/competition?id=4220',
} as Event

const candidate: OfficialResultCandidate = {
  platform: 'maxfunsports',
  matchedName: 'Bernd Graumann',
  time: '00:18:30',
  position: 3,
  totalParticipants: 14278,
  sourceUrl: 'https://www.maxfunsports.com/result/competition?id=4220',
  confidence: 'high',
}

/** The candidate card links the timing notice, so it needs a router. */
function render(ui: ReactElement) {
  return renderComponent(<MemoryRouter>{ui}</MemoryRouter>)
}

function pickFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File(['%PDF-1.4'], 'result-pdf.pdf', { type: 'application/pdf' })
  fireEvent.change(input, { target: { files: [file] } })
  return file
}

beforeEach(() => {
  importResultsPdf.mockReset()
  saveResults.mockReset()
})

afterEach(cleanup)

describe('ResultsPdfUpload', () => {
  it('shows what it found in the PDF, with the field size', async () => {
    importResultsPdf.mockResolvedValue({
      ok: true,
      result: {
        candidates: [candidate],
        truncated: false,
        eventName: 'B2Run Berlin',
        preliminary: false,
      },
    })

    render(<ResultsPdfUpload event={event} platform="maxfunsports" onApplied={vi.fn()} />)
    pickFile()

    expect(await screen.findByText('Bernd Graumann')).toBeInTheDocument()
    expect(screen.getByText('00:18:30')).toBeInTheDocument()
    expect(screen.getByText('3 / 14278')).toBeInTheDocument()
  })

  it('applies the result as verified, with the placing', async () => {
    const onApplied = vi.fn()
    importResultsPdf.mockResolvedValue({
      ok: true,
      result: { candidates: [candidate], truncated: false, preliminary: false },
    })
    saveResults.mockResolvedValue(undefined)

    render(<ResultsPdfUpload event={event} platform="maxfunsports" onApplied={onApplied} />)
    pickFile()

    fireEvent.click(await screen.findByRole('button', { name: /aplicar|apply/i }))

    await waitFor(() => expect(saveResults).toHaveBeenCalled())
    expect(saveResults).toHaveBeenCalledWith('event-1', {
      time: '00:18:30',
      classification: expect.stringContaining('3'),
      verified: true,
    })
    await waitFor(() => expect(onApplied).toHaveBeenCalled())
  })

  it('says the PDF is for another day rather than importing it', async () => {
    importResultsPdf.mockResolvedValue({ ok: false, code: 'wrong_event' })

    render(<ResultsPdfUpload event={event} platform="maxfunsports" onApplied={vi.fn()} />)
    pickFile()

    expect(await screen.findByText(/outra data|another date/i)).toBeInTheDocument()
    expect(screen.queryByText('Bernd Graumann')).not.toBeInTheDocument()
    expect(saveResults).not.toHaveBeenCalled()
  })

  it('passes the event date and results link to the reader', async () => {
    importResultsPdf.mockResolvedValue({ ok: false, code: 'name_not_found' })

    render(<ResultsPdfUpload event={event} platform="maxfunsports" onApplied={vi.fn()} />)
    const file = pickFile()

    await waitFor(() => expect(importResultsPdf).toHaveBeenCalled())
    expect(importResultsPdf).toHaveBeenCalledWith(
      file,
      { date: event.date, platform: 'maxfunsports', resultsUrl: event.resultsUrl },
      { resultLastName: 'Graumann' },
    )
  })

  it('reports a result that could not be saved', async () => {
    importResultsPdf.mockResolvedValue({
      ok: true,
      result: { candidates: [candidate], truncated: false, preliminary: false },
    })
    saveResults.mockRejectedValue(new Error('offline'))

    render(<ResultsPdfUpload event={event} platform="maxfunsports" onApplied={vi.fn()} />)
    pickFile()
    fireEvent.click(await screen.findByRole('button', { name: /aplicar|apply/i }))

    await waitFor(() => expect(saveResults).toHaveBeenCalled())
    // The candidate stays on screen so the runner can try again.
    expect(screen.getByText('Bernd Graumann')).toBeInTheDocument()
  })
})
