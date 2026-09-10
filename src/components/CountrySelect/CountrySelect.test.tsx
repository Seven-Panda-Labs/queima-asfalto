import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CountrySelect } from './CountrySelect'

afterEach(cleanup)

describe('CountrySelect', () => {
  it('names the countries in the reader s language', () => {
    render(<CountrySelect value="" onChange={vi.fn()} />)

    // Not "DE": the point of the list is that nobody has to know the code.
    expect(screen.getByRole('option', { name: 'Alemanha' })).toHaveValue('DE')
  })

  it('orders them by the name on screen, not by the code', () => {
    render(<CountrySelect value="" onChange={vi.fn()} />)

    const names = screen.getAllByRole('option').map((option) => option.textContent ?? '')
    // Sorted by code, Áustria (AT) would come third and Suíça (CH) tenth.
    expect(names.indexOf('Áustria')).toBeLessThan(names.indexOf('Bélgica'))
    expect(names.indexOf('Bélgica')).toBeLessThan(names.indexOf('Suíça'))
  })

  it('reports the ISO code the catalog stores', () => {
    const onChange = vi.fn()
    render(<CountrySelect value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PT' } })

    expect(onChange).toHaveBeenCalledWith('PT')
  })

  it('starts on nothing chosen, so a country is never assumed', () => {
    render(<CountrySelect value="" onChange={vi.fn()} />)

    // Andorra is first alphabetically and would otherwise be the default.
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Escolhe o país')
  })
})
