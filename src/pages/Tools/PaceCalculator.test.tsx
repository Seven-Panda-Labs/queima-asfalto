import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaceCalculator } from './PaceCalculator'

vi.mock('../../contexts/DisciplinesContext', () => ({
  useDisciplines: () => ({ enabledDisciplines: ['km_10', 'mi_10', 'km_42_2'] }),
}))

afterEach(() => {
  cleanup()
})

function renderCalculator() {
  render(
    <MemoryRouter>
      <PaceCalculator />
    </MemoryRouter>,
  )
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

const result = () => screen.getByRole('region', { name: 'Resultado' })

describe('PaceCalculator', () => {
  it('offers the distances enabled in the settings', () => {
    renderCalculator()
    expect(screen.getByRole('button', { name: '10 milhas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '5Km' })).toBeNull()
  })

  it('works out the pace from a preset distance and a time', () => {
    renderCalculator()
    expect(result()).toHaveTextContent('Indica a distância e o tempo.')

    fireEvent.click(screen.getByRole('button', { name: '10Km' }))
    type('Minutos', '45')

    expect(result()).toHaveTextContent('4:30/km')
    expect(result()).toHaveTextContent('7:15 /milha')
  })

  it('works out the time from a distance and a pace per mile', () => {
    renderCalculator()
    fireEvent.click(screen.getByRole('button', { name: 'Tempo' }))

    fireEvent.click(screen.getByRole('button', { name: 'milhas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Maratona' }))
    type('Minutos', '8')

    expect(result()).toHaveTextContent('3:29:45')
  })

  it('works out the distance from a time and a pace', () => {
    renderCalculator()
    fireEvent.click(screen.getByRole('button', { name: 'Distância' }))

    type('Horas', '1')
    const [, paceMinutes] = screen.getAllByLabelText('Minutos')
    fireEvent.change(paceMinutes, { target: { value: '5' } })

    expect(result()).toHaveTextContent('12km')
    expect(result()).toHaveTextContent('7,46 milhas')
  })

  it('converts what is typed when the unit changes', () => {
    renderCalculator()
    fireEvent.click(screen.getByRole('button', { name: 'Tempo' }))
    type('Distância (km)', '10')
    type('Minutos', '5')

    fireEvent.click(screen.getByRole('button', { name: 'milhas' }))

    expect(screen.getByLabelText('Distância (milhas)')).toHaveValue('6.214')
    expect(screen.getByLabelText('Minutos')).toHaveValue(8)
    expect(screen.getByLabelText('Segundos')).toHaveValue(3)
    // The pace field holds whole seconds, so 8:03 /mile carries a second of rounding.
    expect(result()).toHaveTextContent('50:01')
  })
})
