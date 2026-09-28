import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WeightEntry } from '../../types/WeightEntry'
import { toDateInputValue } from '../../utils/date'
import { WeightLog } from './WeightLog'

vi.mock('../../components/Charts/WeightChart', () => ({ WeightChart: () => null }))
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

let entries: WeightEntry[] = []
const saveWeight = vi.fn(async () => 'created' as const)
const removeWeight = vi.fn(async () => {})
vi.mock('../../hooks/useWeightEntries', () => ({
  useWeightEntries: () => ({ entries, loading: false, error: null, saveWeight, removeWeight }),
}))

function entry(date: string, weightKg: number): WeightEntry {
  return { id: date, userId: 'user-ze', date, weightKg, createdAt: new Date(0), updatedAt: new Date(0) }
}

function renderLog() {
  render(
    <MemoryRouter>
      <WeightLog />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  entries = []
  saveWeight.mockClear()
})

describe('WeightLog', () => {
  it('stays quiet until the first weigh-in', () => {
    renderLog()
    expect(screen.getByText('Ainda não há registos.')).toBeInTheDocument()
    expect(screen.queryByText('Atual')).toBeNull()
  })

  it('saves a weight for today unless another day is picked', async () => {
    renderLog()
    const save = screen.getByRole('button', { name: 'Guardar' })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '94,1' } })
    fireEvent.click(save)

    await waitFor(() => expect(saveWeight).toHaveBeenCalledWith(toDateInputValue(new Date()), 94.1))
  })

  it('refuses an implausible weight', () => {
    renderLog()
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '9' } })
    expect(screen.getByText('Indica um peso entre 20 e 400 kg.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('shows the current weight and how it moved, with the entries folded, newest first', () => {
    entries = [entry('2026-09-16', 94.6), entry('2026-09-20', 95), entry('2026-09-27', 94.1)]
    renderLog()

    const current = screen.getByText('Atual').nextElementSibling
    expect(current).toHaveTextContent('94,1 kg')
    expect(screen.getByText('7 dias').nextElementSibling).toHaveTextContent('desceu 0,9 kg')
    expect(screen.getByText('Total').nextElementSibling).toHaveTextContent('desceu 0,5 kg')

    const list = screen.getByText('Registos (3)').closest('details')
    expect(list).not.toHaveAttribute('open')
    expect(screen.getAllByRole('listitem', { hidden: true })[0]).toHaveTextContent('27/09/2026')
  })
})
