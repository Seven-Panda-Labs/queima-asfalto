import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminUser } from '../../services/admin'
import { AdminUsers } from './AdminUsers'

const listUsersForAdmin = vi.fn()
const setAccountStatusForAdmin = vi.fn(async (_uid: string, _status: string) => {})

vi.mock('../../services/admin', () => ({
  listUsersForAdmin: () => listUsersForAdmin(),
  setAccountStatusForAdmin: (uid: string, status: string) =>
    setAccountStatusForAdmin(uid, status),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-admin' } }),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

// The tabs need a router, and this file is about the table.
vi.mock('./AdminTabs', () => ({ AdminTabs: () => null }))

vi.mock('../../components/PageShell/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function user(overrides: Partial<AdminUser>): AdminUser {
  return {
    uid: 'user-1',
    name: 'Zé Ninguém',
    email: 'ze@example.test',
    accountStatus: 'pending',
    admin: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AdminUsers', () => {
  it('puts the accounts waiting on somebody first', async () => {
    listUsersForAdmin.mockResolvedValue({
      users: [
        user({ uid: 'user-approved', name: 'Approved', accountStatus: 'approved' }),
        user({ uid: 'user-pending', name: 'Pending', accountStatus: 'pending' }),
      ],
      truncated: false,
    })

    render(<AdminUsers />)

    await waitFor(() => expect(screen.getByText('Pending')).toBeInTheDocument())
    const names = screen.getAllByText(/Pending|Approved/).map((node) => node.textContent)
    expect(names[0]).toBe('Pending')
  })

  it('approves an account and reflects it without reloading', async () => {
    listUsersForAdmin.mockResolvedValue({
      users: [user({ uid: 'user-pending' })],
      truncated: false,
    })

    render(<AdminUsers />)
    await waitFor(() => expect(screen.getByText('Aprovar')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Aprovar'))

    await waitFor(() =>
      expect(setAccountStatusForAdmin).toHaveBeenCalledWith('user-pending', 'approved'),
    )
    // Approved rows offer only the block action.
    await waitFor(() => expect(screen.queryByText('Aprovar')).not.toBeInTheDocument())
    expect(screen.getByText('Bloquear')).toBeInTheDocument()
  })

  it('offers no action on the account of whoever is looking', async () => {
    listUsersForAdmin.mockResolvedValue({
      users: [user({ uid: 'user-admin', name: 'Me', admin: true, accountStatus: 'approved' })],
      truncated: false,
    })

    render(<AdminUsers />)

    await waitFor(() => expect(screen.getByText('É a tua conta')).toBeInTheDocument())
    expect(screen.queryByText('Bloquear')).not.toBeInTheDocument()
  })

  it('says so when the load fails, rather than showing an empty table', async () => {
    listUsersForAdmin.mockRejectedValue(new Error('nope'))

    render(<AdminUsers />)

    await waitFor(() =>
      expect(screen.getByText('Não foi possível carregar as contas.')).toBeInTheDocument(),
    )
  })
})
