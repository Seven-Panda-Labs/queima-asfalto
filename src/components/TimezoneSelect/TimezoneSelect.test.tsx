import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimezoneSelect } from './TimezoneSelect'

afterEach(cleanup)

describe('TimezoneSelect', () => {
  it('offers a zone under its region, with the offset that tells it apart', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} />)

    // Lisbon and the Azores are one hour apart and the names do not say so.
    const lisbon = screen.getByRole('option', { name: /^Lisbon/ })
    expect(lisbon).toHaveValue('Europe/Lisbon')
    expect(lisbon.textContent).toMatch(/UTC[+-]\d\d:\d\d/)
    expect(lisbon.closest('optgroup')).toHaveAttribute('label', 'Europe')
  })

  it('reads a nested name as a place', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} />)

    expect(screen.getByRole('option', { name: /^Argentina \/ Salta/ })).toHaveValue(
      'America/Argentina/Salta',
    )
  })

  it('reports the IANA name, which is what the entry stores', () => {
    const onChange = vi.fn()
    render(<TimezoneSelect value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Europe/Lisbon' } })

    expect(onChange).toHaveBeenCalledWith('Europe/Lisbon')
  })

  it('starts on nothing, because an edition can have no zone', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('keeps a zone the browser does not know, instead of showing another one', () => {
    // A harvest wrote it, or the browser is older than the zone.
    render(<TimezoneSelect value="Mars/Olympus_Mons" onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue('Mars/Olympus_Mons')
  })
})
