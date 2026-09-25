import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeField } from './TimeField'

afterEach(cleanup)

describe('TimeField', () => {
  it('shows the hour on the 24-hour clock and keeps the minutes when the hour changes', () => {
    const onChange = vi.fn()
    render(<TimeField id="t" value="17:45" onChange={onChange} />)

    const [hour, minute] = screen.getAllByRole('combobox')
    expect(hour).toHaveValue('17')
    expect(minute).toHaveValue('45')

    fireEvent.change(hour!, { target: { value: '09' } })
    expect(onChange).toHaveBeenLastCalledWith('09:45')
  })

  it('clears an optional hour, and starts an empty one on the hour', () => {
    const onChange = vi.fn()
    const { rerender } = render(<TimeField value="08:30" optional onChange={onChange} />)

    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(undefined)

    rerender(<TimeField value={undefined} optional onChange={onChange} />)
    expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: '21' } })
    expect(onChange).toHaveBeenLastCalledWith('21:00')
  })
})
