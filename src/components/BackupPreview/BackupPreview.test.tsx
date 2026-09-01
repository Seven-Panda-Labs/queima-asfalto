import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BackupManifest, RestoreRejection } from '../../services/backupFormat'
import type { BackupSummary } from '../../services/backupImport'
import { BackupPreview, type ExistingCounts } from './BackupPreview'

afterEach(() => {
  cleanup()
})

const manifest: BackupManifest = {
  app: 'queima-asfalto',
  kind: 'user-backup',
  schemaVersion: 1,
  appVersion: '1.15.0',
  exportedAt: '2026-08-03T10:42:07.512Z',
  userId: 'user-ze',
  counts: {
    events: 12,
    eventMedia: 3,
    eventTracks: 2,
    goals: 2,
    performanceGoals: 1,
    bucketListItems: 4,
    races: 5,
    userProfile: 1,
    shares: 2,
  },
  files: {
    events: 'events.json',
    eventMedia: 'eventMedia.json',
    eventTracks: 'eventTracks.json',
    goals: 'goals.json',
    performanceGoals: 'performanceGoals.json',
    bucketListItems: 'bucketListItems.json',
    races: 'races.json',
    userProfile: 'userProfile.json',
    shares: 'shares.json',
  },
  mediaFiles: { count: 0, sizeBytes: 0 },
  trackFiles: { count: 2, sizeBytes: 320000 },
  restorable: [],
  exportOnly: ['shares'],
  omitted: ['storageBinaries'],
}

function summaryWith(overrides: Partial<BackupSummary> = {}): BackupSummary {
  return {
    counts: manifest.counts,
    restorableTotal: 23,
    crossAccount: false,
    mediaFileCount: 0,
    mediaFileBytes: 0,
    trackFileCount: 0,
    hasTrackFiles: false,
    hasMediaFiles: false,
    warnings: ['media_binaries_not_restored', 'reminders_not_restored', 'shares_not_restored'],
    ...overrides,
  }
}

function summaryWithMediaFiles(overrides: Partial<BackupSummary> = {}): BackupSummary {
  return summaryWith({
    mediaFileCount: 3,
    mediaFileBytes: 7 * 1024 * 1024,
    hasMediaFiles: true,
    warnings: ['reminders_not_restored', 'shares_not_restored'],
    ...overrides,
  })
}

const existing: ExistingCounts = {
  events: 5,
  goals: 2,
  performanceGoals: 0,
  bucketListItems: 1,
}

function renderPreview(props: Partial<Parameters<typeof BackupPreview>[0]> = {}) {
  const onModeChange = vi.fn()
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  render(
    <BackupPreview
      manifest={manifest}
      summary={summaryWith()}
      existing={existing}
      rejections={[]}
      mode="merge"
      onModeChange={onModeChange}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )

  return { onModeChange, onConfirm, onCancel }
}

describe('BackupPreview', () => {
  it('lists the manifest metadata and the per-section counts', () => {
    renderPreview()

    expect(screen.getByText('Conteúdo do backup')).toBeInTheDocument()
    expect(screen.getByText('Versão da app: 1.15.0')).toBeInTheDocument()
    expect(screen.getByText('Formato do backup: v1')).toBeInTheDocument()
    expect(screen.getByText(/12 eventos/)).toBeInTheDocument()
    expect(screen.getByText(/4 itens da bucket list/)).toBeInTheDocument()
    expect(screen.getByText(/Perfil: idioma/)).toBeInTheDocument()
  })

  it('marks shares as not restorable', () => {
    renderPreview()

    expect(screen.getByText(/2 partilhas \(não restauráveis\)/)).toBeInTheDocument()
    expect(screen.getByText(/tens de voltar a convidar/)).toBeInTheDocument()
  })

  it('shows the new versus overwritten split in merge mode', () => {
    renderPreview()

    expect(screen.getByText('(7 novos, 5 a substituir)')).toBeInTheDocument()
  })

  it('hides the diff and shows a loading hint while existing counts are unknown', () => {
    renderPreview({ existing: null })

    expect(screen.queryByText(/a substituir/)).not.toBeInTheDocument()
    expect(screen.getByText('A contar os dados actuais...')).toBeInTheDocument()
  })

  it('omits sections the backup does not contain', () => {
    renderPreview({
      summary: summaryWith({ counts: { ...manifest.counts, eventMedia: 0, shares: 0 } }),
    })

    expect(screen.queryByText(/metadados de fotos/)).not.toBeInTheDocument()
    expect(screen.queryByText(/partilhas \(não restauráveis\)/)).not.toBeInTheDocument()
  })

  it('reports the mode change when the replace radio is picked', () => {
    const { onModeChange } = renderPreview()

    fireEvent.click(screen.getByRole('radio', { name: /Substituir tudo/ }))

    expect(onModeChange).toHaveBeenCalledWith('replace')
  })

  it('warns about permanent photo and video loss only in replace mode', () => {
    const { unmount } = render(
      <BackupPreview
        manifest={manifest}
        summary={summaryWith()}
        existing={existing}
        rejections={[]}
        mode="merge"
        onModeChange={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByText(/apagados em definitivo/)).not.toBeInTheDocument()
    unmount()

    renderPreview({ mode: 'replace' })

    expect(screen.getByText(/apagados em definitivo/)).toBeInTheDocument()
  })

  it('lists the bundled photo and video files when the zip carries them', () => {
    renderPreview({ summary: summaryWithMediaFiles() })

    expect(
      screen.getByText('3 ficheiros de fotos e vídeos (7 MB), serão recuperados'),
    ).toBeInTheDocument()
  })

  it('drops the metadata-only warning when the binaries are bundled', () => {
    renderPreview({ summary: summaryWithMediaFiles() })

    expect(screen.queryByText(/só os metadados/)).not.toBeInTheDocument()
  })

  it('does not warn about losing media in replace mode when the zip can restore it', () => {
    renderPreview({ summary: summaryWithMediaFiles(), mode: 'replace' })

    expect(screen.queryByText(/apagados em definitivo/)).not.toBeInTheDocument()
    expect(screen.getByText(/as fotos e vídeos são recuperados/)).toBeInTheDocument()
  })

  it('omits the warnings panel entirely when there is nothing to warn about', () => {
    renderPreview({
      summary: summaryWithMediaFiles({ warnings: [] }),
    })

    expect(screen.queryByText('O que não é restaurado')).not.toBeInTheDocument()
  })

  it('labels the confirm button for the destructive mode', () => {
    renderPreview({ mode: 'replace' })

    expect(screen.getByRole('button', { name: 'Substituir tudo' })).toBeInTheDocument()
  })

  it('disables confirming when there is nothing to restore', () => {
    renderPreview({ summary: summaryWith({ restorableTotal: 0 }) })

    expect(screen.getByRole('button', { name: 'Restaurar dados' })).toBeDisabled()
    expect(screen.getByText('Não há nada para restaurar neste backup.')).toBeInTheDocument()
  })

  it('calls onConfirm and onCancel', () => {
    const { onConfirm, onCancel } = renderPreview()

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar dados' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('reveals rejected documents behind a toggle', () => {
    const rejections: RestoreRejection[] = [
      { section: 'events', id: 'event-9', reason: 'invalid_distance' },
    ]
    renderPreview({ rejections })

    expect(screen.queryByText(/event-9/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ver documentos rejeitados (1)' }))

    expect(screen.getByText('Eventos event-9: Distância inválida')).toBeInTheDocument()
  })

  it('links each mode hint to its radio for assistive technology', () => {
    renderPreview()

    expect(screen.getByRole('radio', { name: /Juntar/ })).toHaveAttribute(
      'aria-describedby',
      'backup-mode-merge-hint',
    )
    expect(screen.getByRole('group', { name: 'Como queres restaurar?' })).toBeInTheDocument()
  })
})
