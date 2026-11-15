import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { RowActions } from './RowActions'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false
  }
})

afterEach(cleanup)

describe('RowActions', () => {
  it('opens every action in a sheet named after the row, and closes it on a pick', () => {
    const remove = vi.fn()
    render(
      <MemoryRouter>
        <RowActions
          title="Corrida do Zé"
          actions={[
            { label: 'Editar', icon: null, to: '/eventos/1/editar' },
            { label: 'Apagar', icon: null, danger: true, onClick: remove },
          ]}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ações' }))
    const sheet = screen.getByRole('dialog', { name: 'Corrida do Zé' })
    expect(within(sheet).getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/eventos/1/editar')

    fireEvent.click(within(sheet).getByRole('button', { name: 'Apagar' }))
    expect(remove).toHaveBeenCalledOnce()
    expect(sheet).not.toHaveAttribute('open')
  })

  it('shows a single action as it is, with no sheet', () => {
    render(<RowActions title="Corrida do Zé" actions={[{ label: 'Site oficial', icon: null, href: 'https://example.com' }]} />)

    expect(screen.getByRole('link', { name: 'Site oficial' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.queryByRole('button', { name: 'Ações' })).toBeNull()
  })
})
