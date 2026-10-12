import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Share, SharePermissions } from '../types/Share'
import { DEFAULT_SHARE_PERMISSIONS } from '../types/Share'

let received: Share[] = []

vi.mock('../hooks/useShares', () => ({
  useShares: () => ({ shares: { sent: [], received }, refresh: () => Promise.resolve() }),
}))

const { SharedViewProvider, useSharedView } = await import('./SharedViewContext')
const { useSharedSection } = await import('../hooks/useSharedSection')

function share(ownerId: string, permissions: Partial<SharePermissions>, status: Share['status'] = 'active'): Share {
  return {
    id: `share-${ownerId}`,
    ownerId,
    ownerDisplayName: `Zé ${ownerId}`,
    granteeEmail: 'ze.ninguem@example.com',
    status,
    permissions: { ...DEFAULT_SHARE_PERMISSIONS, ...permissions },
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  }
}

let controls: {
  view: ReturnType<typeof useSharedView>
  goals: ReturnType<typeof useSharedSection>
  navigate: ReturnType<typeof useNavigate>
}

function Probe() {
  const location = useLocation()
  controls = { view: useSharedView(), goals: useSharedSection('goals'), navigate: useNavigate() }
  return (
    <>
      <p data-testid="location">{location.pathname + location.search}</p>
      <p data-testid="viewed">{controls.view.viewedOwner?.ownerId ?? 'mine'}</p>
    </>
  )
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SharedViewProvider>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </SharedViewProvider>
    </MemoryRouter>,
  )
}

describe('SharedViewProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
    received = [share('ana', { events: 'read' }), share('rui', { events: 'read', goals: 'read' })]
  })

  afterEach(cleanup)

  it('keeps the chosen person across pages', () => {
    renderAt('/eventos')
    act(() => controls.view.setViewedOwnerId('ana'))
    act(() => controls.navigate('/analise'))

    expect(screen.getByTestId('viewed')).toHaveTextContent('ana')
  })

  it('adopts the person named in a link', () => {
    renderAt('/eventos/e1?owner=rui')

    expect(screen.getByTestId('viewed')).toHaveTextContent('rui')
  })

  it('leaves the shared view on a page that is not theirs', () => {
    renderAt('/eventos')
    act(() => controls.view.setViewedOwnerId('ana'))
    act(() => controls.navigate('/'))

    expect(screen.getByTestId('viewed')).toHaveTextContent('mine')
  })

  it('leaves the shared view on a section the person does not share', () => {
    renderAt('/objetivos?owner=ana')

    expect(screen.getByTestId('viewed')).toHaveTextContent('mine')
    expect(controls.goals.isSharedView).toBe(false)
  })

  it('opens the first shared section when picking a person elsewhere', () => {
    renderAt('/definicoes')
    act(() => controls.view.setViewedOwnerId('rui'))

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/eventos$/)
    expect(screen.getByTestId('viewed')).toHaveTextContent('rui')
  })

  it('leaves a shared event for the list when going back to my data', () => {
    renderAt('/eventos/e1?owner=rui')
    act(() => controls.view.setViewedOwnerId(null))

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/eventos$/)
    expect(screen.getByTestId('viewed')).toHaveTextContent('mine')
  })

  it('offers only active shares', () => {
    received = [share('ana', { events: 'read' }), share('rui', { events: 'read' }, 'pending')]
    renderAt('/eventos')

    expect(controls.view.owners.map((owner) => owner.ownerId)).toEqual(['ana'])
  })
})
