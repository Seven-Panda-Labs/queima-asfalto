import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import { exportEventsToExcel } from '../../services/export'
import { exportUserBackup, type BackupExportProgress } from '../../services/backupExport'
import { MAX_BACKUP_MEDIA_TOTAL_BYTES } from '../../services/backupFormat'
import { BackupSection } from './BackupSection'
import { ImportSection } from './ImportSection'
import { ResultsProfileSection } from './ResultsProfileSection'

const mediaCapMegabytes = Math.round(MAX_BACKUP_MEDIA_TOTAL_BYTES / (1024 * 1024))

export function SettingsDataSection() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const { user } = useAuth()
  const { allEvents } = useEvents()
  const { items: bucketListItems } = useBucketList()
  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(() => searchParams.get('import') === '1')
  const [backupExporting, setBackupExporting] = useState(false)
  const [backupProgress, setBackupProgress] = useState<BackupExportProgress | null>(null)
  const [includeMediaFiles, setIncludeMediaFiles] = useState(true)
  const [restoreOpen, setRestoreOpen] = useState(() => searchParams.get('restore') === '1')

  const noData = allEvents.length === 0 && bucketListItems.length === 0

  async function handleExport() {
    if (noData) return

    setExporting(true)
    try {
      await exportEventsToExcel(allEvents, undefined, bucketListItems)
      toast.success(t('settings.exportSuccess'))
    } catch {
      toast.error(t('settings.exportError'))
    } finally {
      setExporting(false)
    }
  }

  async function handleBackupExport() {
    if (!user || noData) return

    setBackupExporting(true)
    setBackupProgress(null)
    try {
      const result = await exportUserBackup(user.uid, { includeMediaFiles }, setBackupProgress)
      if (result.warnings.includes('media_files_too_large')) {
        toast.error(t('backup.exportMediaTooLarge', { max: mediaCapMegabytes }))
      } else {
        toast.success(t('backup.exportSuccess'))
      }
    } catch {
      toast.error(t('backup.exportError'))
    } finally {
      setBackupExporting(false)
      setBackupProgress(null)
    }
  }

  function backupProgressLabel(): string {
    if (!backupProgress) return t('backup.exporting')
    if (backupProgress.phase === 'collections') return t('backup.exportProgressCollections')
    if (backupProgress.phase === 'zipping') return t('backup.exportProgressZipping')
    if (backupProgress.phase === 'mediaFiles') {
      return t('backup.exportProgressMediaFiles', {
        done: backupProgress.done,
        total: backupProgress.total,
        mb: Math.round(backupProgress.bytes / (1024 * 1024)),
        totalMb: Math.round(backupProgress.totalBytes / (1024 * 1024)),
      })
    }
    return t('backup.exportProgressMedia', {
      done: backupProgress.done,
      total: backupProgress.total,
    })
  }

  return (
    <div className="space-y-6">
      <ResultsProfileSection />

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.data')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settings.dataSubtitle')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            {t('settings.importExcel')}
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || noData}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? t('settings.exporting') : t('settings.exportExcel')}
          </button>
        </div>
        {noData ? <p className="mt-3 text-xs text-muted">{t('settings.exportUnavailable')}</p> : null}

        {importOpen ? (
          <div className="mt-6 border-t border-border pt-6">
            <ImportSection embedded />
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('backup.title')}</h2>
        <p className="mt-2 text-sm text-muted">{t('backup.subtitle')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setRestoreOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            {t('backup.restore')}
          </button>
          <button
            type="button"
            onClick={() => void handleBackupExport()}
            disabled={backupExporting || noData}
            aria-describedby={noData ? 'backup-export-hint' : undefined}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backupExporting ? backupProgressLabel() : t('backup.export')}
          </button>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={includeMediaFiles}
            onChange={(event) => setIncludeMediaFiles(event.target.checked)}
            disabled={backupExporting}
            aria-describedby="backup-media-hint"
            className="mt-1 border-border"
          />
          <span>
            {t('backup.includeMediaFiles')}
            <span id="backup-media-hint" className="block text-xs text-muted">
              {t('backup.includeMediaFilesHint', { max: mediaCapMegabytes })}
            </span>
          </span>
        </label>

        <p className="mt-3 text-xs text-muted">{t('backup.exportIncludes')}</p>
        {noData ? (
          <p id="backup-export-hint" className="mt-1 text-xs text-muted">
            {t('backup.exportUnavailable')}
          </p>
        ) : null}

        {restoreOpen ? (
          <div className="mt-6 border-t border-border pt-6">
            <BackupSection embedded />
          </div>
        ) : null}
      </section>
    </div>
  )
}
