import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EventType } from '../../domain/eventCodes'
import { DisciplinesSection } from './DisciplinesSection'

const saveEnabledDisciplines = vi.fn(async () => {})
const toastError = vi.fn()
let enabledDisciplines: EventType[] = ['km_5', 'km_10', 'km_21_1', 'km_42_2']

vi.mock('../../contexts/DisciplinesContext', () => ({
  useDisciplines: () => ({
    enabledDisciplines,
    loading: false,
    saving: false,
    error: null,
    saveEnabledDisciplines,
  }),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ error: toastError, success: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  enabledDisciplines = ['km_5', 'km_10', 'km_21_1', 'km_42_2']
})

describe('DisciplinesSection', () => {
  it('groups the catalogue instead of listing thirteen rows', () => {
    render(<DisciplinesSection />)

    // Three group labels, one checkbox per discipline underneath them.
    expect(screen.getByText('Pista e curtas')).toBeInTheDocument()
    expect(screen.getByText('Estrada')).toBeInTheDocument()
    expect(screen.getByText('Ultra')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(13)
  })

  it('shows the four the app ships with as the checked ones', () => {
    render(<DisciplinesSection />)

    const checked = screen
      .getAllByRole('checkbox')
      .filter((box) => (box as HTMLInputElement).checked)
    expect(checked).toHaveLength(4)
  })

  it('adds a discipline in distance order, not in click order', () => {
    render(<DisciplinesSection />)

    fireEvent.click(screen.getByRole('checkbox', { name: '100Km' }))

    expect(saveEnabledDisciplines).toHaveBeenCalledWith([
      'km_5',
      'km_10',
      'km_21_1',
      'km_42_2',
      'km_100',
    ])
  })

  it('will not let the last discipline be turned off', () => {
    enabledDisciplines = ['km_10']
    render(<DisciplinesSection />)

    const only = screen.getByRole('checkbox', { name: '10Km' }) as HTMLInputElement
    expect(only.disabled).toBe(true)

    fireEvent.click(only)
    expect(saveEnabledDisciplines).not.toHaveBeenCalled()
  })
})
