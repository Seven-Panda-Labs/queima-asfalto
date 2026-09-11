import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CurrencySelect } from './CurrencySelect'

afterEach(cleanup)

describe('CurrencySelect', () => {
  it('names the currency beside its code', () => {
    render(<CurrencySelect value="" onChange={vi.fn()} />)

    expect(screen.getByRole('option', { name: /^EUR · /u })).toHaveValue('EUR')
  })

  it('reports the ISO code, which is what an edition stores', () => {
    const onChange = vi.fn()
    render(<CurrencySelect value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CHF' } })

    expect(onChange).toHaveBeenCalledWith('CHF')
  })

  it('starts on nothing, because an edition may have no fee', () => {
    render(<CurrencySelect value="" onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('keeps a code the browser does not know, instead of showing another', () => {
    render(<CurrencySelect value="XBT" onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('XBT')
  })
})
