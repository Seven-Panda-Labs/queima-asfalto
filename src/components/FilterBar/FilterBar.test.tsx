import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FilterYears } from './FilterBar'

afterEach(cleanup)

function pills(): string[] {
  return screen.getAllByRole('button').map((button) => button.textContent ?? '')
}

function listed(): string[] {
  return screen.getAllByRole('option').map((option) => option.textContent ?? '').slice(1)
}

describe('FilterYears', () => {
  it('keeps the coming seasons and the latest past one as pills, and lists the rest', () => {
    render(
      <FilterYears
        years={[2032, 2027, 2026, 2025, 2024, 2019]}
        currentYear={2026}
        value={2026}
        onChange={vi.fn()}
      />,
    )

    expect(pills()).toEqual(['2032', '2027', '2026', '2025'])
    expect(listed()).toEqual(['2024', '2019'])
  })

  it('takes the latest past season the runner has, not simply last year', () => {
    render(<FilterYears years={[2026, 2023, 2021]} currentYear={2026} value={2026} onChange={vi.fn()} />)

    expect(pills()).toEqual(['2026', '2023'])
    expect(listed()).toEqual(['2021'])
  })

  it('shows an older season picked from the list as the active filter', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <FilterYears years={[2026, 2025, 2021]} currentYear={2026} value="all" onChange={onChange} />,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2021' } })
    expect(onChange).toHaveBeenCalledWith(2021)

    rerender(<FilterYears years={[2026, 2025, 2021]} currentYear={2026} value={2021} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveValue('2021')
  })

  it('has no list while every season fits as a pill', () => {
    render(<FilterYears years={[2027, 2026, 2025]} currentYear={2026} value={2026} onChange={vi.fn()} />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
