import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BackupRestoreResult } from '../../services/backupImport'
import { BackupReport } from './BackupReport'

afterEach(() => {
  cleanup()
})

function resultWith(overrides: Partial<BackupRestoreResult> = {}): BackupRestoreResult {
  return {
    mode: 'merge',
    deleted: null,
    sections: {
      events: { created: 10, updated: 2, skipped: 0, rejected: 0 },
      eventMedia: { created: 0, updated: 0, skipped: 0, rejected: 0 },
      eventTracks: { created: 0, updated: 0, skipped: 0, rejected: 0 },
      goals: { created: 1, updated: 0, skipped: 0, rejected: 0 },
      performanceGoals: { created: 0, updated: 0, skipped: 0, rejected: 0 },
      bucketListItems: { created: 0, updated: 0, skipped: 0, rejected: 0 },
      userProfile: { created: 0, updated: 1, skipped: 0, rejected: 0 },
    },
    sharesIgnored: 0,
    rejections: [],
    warnings: [],
    errors: [],
    ...overrides,
  }
}

function renderReport(overrides: Partial<BackupRestoreResult> = {}) {
  const onRestoreAnother = vi.fn()
  render(
    <MemoryRouter>
      <BackupReport result={resultWith(overrides)} onRestoreAnother={onRestoreAnother} />
    </MemoryRouter>,
  )
  return { onRestoreAnother }
}

describe('BackupReport', () => {
  it('reports the sections it touched and omits the untouched ones', () => {
    renderReport()

    expect(screen.getByText('Restauro concluído')).toBeInTheDocument()
    expect(
      screen.getByText('Eventos: 10 criados, 2 substituídos, 0 ignorados'),
    ).toBeInTheDocument()
    expect(screen.getByText('Objetivos: 1 criados, 0 substituídos, 0 ignorados')).toBeInTheDocument()
    expect(screen.queryByText(/^Bucket list:/)).not.toBeInTheDocument()
  })

  it('shows the deleted counts only in replace mode', () => {
    renderReport()
    expect(screen.queryByText(/Apagados:/)).not.toBeInTheDocument()
    cleanup()

    renderReport({
      mode: 'replace',
      deleted: { events: 8, goals: 2, performanceGoals: 1, bucketListItems: 3, eventMedia: 5 },
    })

    expect(
      screen.getByText(
        '🗑️ Apagados: 8 eventos, 2 objetivos, 1 metas de performance, 3 itens da bucket list, 5 fotos e vídeos',
      ),
    ).toBeInTheDocument()
  })

  it('shows the rejected count next to its section', () => {
    renderReport({
      sections: {
        ...resultWith().sections,
        events: { created: 9, updated: 0, skipped: 0, rejected: 3 },
      },
    })

    expect(screen.getByText('Eventos: 3 rejeitados')).toBeInTheDocument()
  })

  it('shows the partial errors panel only when there are errors', () => {
    renderReport()
    expect(screen.queryByText('Erros parciais')).not.toBeInTheDocument()
    cleanup()

    renderReport({ errors: ['events[0..499]: permission-denied'] })

    expect(screen.getByText('Erros parciais')).toBeInTheDocument()
    expect(screen.getByText('events[0..499]: permission-denied')).toBeInTheDocument()
  })

  it('lists the warnings it was given, de-duplicated', () => {
    renderReport({
      warnings: ['media_not_restored_replace_mode', 'shares_not_restored', 'shares_not_restored'],
    })

    expect(screen.getByText('O que não é restaurado')).toBeInTheDocument()
    expect(screen.getAllByText(/tens de voltar a convidar/)).toHaveLength(1)
    expect(screen.getByText(/apagados em definitivo/)).toBeInTheDocument()
  })

  it('shows ignored shares when the backup carried any', () => {
    renderReport({ sharesIgnored: 2 })

    expect(screen.getByText('🔗 2 partilhas ignoradas (não restauráveis)')).toBeInTheDocument()
  })

  it('shows the rejected details disclosure only when there are rejections', () => {
    renderReport()
    expect(screen.queryByText('Detalhe dos documentos rejeitados')).not.toBeInTheDocument()
    cleanup()

    renderReport({
      rejections: [{ section: 'eventMedia', id: 'media-3', reason: 'unknown_event' }],
    })

    expect(screen.getByText('Detalhe dos documentos rejeitados')).toBeInTheDocument()
    expect(
      screen.getByText('Fotos e vídeos media-3: O evento associado não existe'),
    ).toBeInTheDocument()
  })

  it('offers a link to the events page and a restore-another action', () => {
    const { onRestoreAnother } = renderReport()

    expect(screen.getByRole('link', { name: 'Ver Eventos' })).toHaveAttribute('href', '/eventos')

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar outro ficheiro' }))
    expect(onRestoreAnother).toHaveBeenCalledTimes(1)
  })
})
