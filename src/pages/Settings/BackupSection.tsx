import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackupPreview, type ExistingCounts } from '../../components/BackupPreview'
import { BackupReport } from '../../components/BackupReport'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ProgressBar } from '../../components/ProgressBar'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { formatBackupSectionLabel } from '../../i18n/formatters'
import {
  BACKUP_SCHEMA_VERSION,
  BackupFormatError,
  MAX_BACKUP_BYTES,
  type ParsedBackup,
} from '../../services/backupFormat'
import {
  countExistingUserData,
  planBackupRestore,
  readBackupFile,
  restoreUserBackup,
  summarizeBackup,
  type BackupRestoreMode,
  type BackupRestoreProgress,
  type BackupRestoreResult,
  type BackupSummary,
} from '../../services/backupImport'

type BackupStep = 'idle' | 'reading' | 'preview' | 'restoring' | 'done' | 'error'

type BackupSectionProps = {
  embedded?: boolean
}

export function BackupSection({ embedded = false }: BackupSectionProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<BackupStep>('idle')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedBackup | null>(null)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [existing, setExisting] = useState<ExistingCounts | null>(null)
  const [mode, setMode] = useState<BackupRestoreMode>('merge')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [progress, setProgress] = useState<BackupRestoreProgress | null>(null)
  const [result, setResult] = useState<BackupRestoreResult | null>(null)

  // Validation is pure but walks every document, so keep it off the render path.
  const rejections = useMemo(
    () => (parsed && user ? planBackupRestore(parsed, user.uid, mode) : []),
    [parsed, user, mode],
  )

  function reset() {
    setStep('idle')
    setDragging(false)
    setError(null)
    setFileName(null)
    setParsed(null)
    setSummary(null)
    setExisting(null)
    setMode('merge')
    setConfirmOpen(false)
    setProgress(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function messageForError(caught: unknown): string {
    if (!(caught instanceof BackupFormatError)) return t('backup.readError')

    switch (caught.code) {
      case 'too_large':
        return t('backup.tooLarge', { max: Math.round(MAX_BACKUP_BYTES / (1024 * 1024)) })
      case 'missing_manifest':
        return t('backup.notABackup')
      case 'looks_like_excel':
        return t('backup.looksLikeExcel')
      case 'unsupported_schema_version':
        return t('backup.unsupportedVersion', {
          fileVersion: caught.detail ?? '?',
          supportedVersion: BACKUP_SCHEMA_VERSION,
        })
      case 'empty_backup':
        return t('backup.emptyBackup')
      case 'invalid_manifest':
      case 'foreign_backup':
        return t('backup.notABackup')
      case 'invalid_collection_file':
      case 'count_mismatch':
      case 'unsupported_value':
        return t('backup.corruptFile', { detail: caught.detail ?? '' })
      case 'corrupt_zip':
        return t('backup.readError')
    }
  }

  async function handleFileSelected(file: File | null) {
    if (!file || !user) return

    setDragging(false)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError(t('backup.invalidExtension'))
      setStep('error')
      return
    }

    setFileName(file.name)
    setStep('reading')
    setError(null)

    try {
      const backup = await readBackupFile(file)
      const nextSummary = summarizeBackup(backup, user.uid)
      setParsed(backup)
      setSummary(nextSummary)
      setStep('preview')

      // Lets the preview show "N new, N to overwrite" for merge mode.
      countExistingUserData(user.uid)
        .then(setExisting)
        .catch(() => setExisting(null))
    } catch (caught) {
      setError(messageForError(caught))
      setStep('error')
    }
  }

  async function handleRestore() {
    if (!user || !parsed) return

    setConfirmOpen(false)
    setStep('restoring')
    setProgress(null)

    try {
      const restored = await restoreUserBackup(user.uid, parsed, { mode }, setProgress)
      setResult(restored)
      setStep('done')
      toast.success(t('backup.restoreSuccess'))
    } catch {
      setError(t('backup.restoreError'))
      setStep('error')
      toast.error(t('backup.restoreError'))
    }
  }

  function handleConfirmClicked() {
    if (mode === 'replace') {
      setConfirmOpen(true)
      return
    }
    void handleRestore()
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('backup.restoreTitle')}</h2>
          <p className="mt-2 text-sm text-muted">{t('backup.restoreSubtitle')}</p>
        </div>
      ) : null}

      {step === 'idle' || step === 'error' ? (
        <div
          className={[
            'rounded-lg border-2 border-dashed bg-surface p-8 text-center',
            dragging ? 'border-primary bg-primary/5' : 'border-border',
          ].join(' ')}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            void handleFileSelected(event.dataTransfer.files[0] ?? null)
          }}
        >
          <p id="backup-drop-label" className="font-semibold text-foreground">
            {t('backup.dragDrop')}
          </p>
          <label htmlFor="backup-file" className="sr-only">
            {t('backup.selectFile')}
          </label>
          <input
            id="backup-file"
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            aria-describedby="backup-drop-label"
            className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-hover"
            onChange={(event) => void handleFileSelected(event.target.files?.[0] ?? null)}
          />
        </div>
      ) : null}

      {step === 'reading' ? (
        <p role="status" aria-live="polite" className="text-muted">
          {t('backup.reading', { file: fileName ?? t('backup.selectFile') })}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {step === 'preview' && parsed && summary ? (
        <BackupPreview
          manifest={parsed.manifest}
          summary={summary}
          existing={existing}
          rejections={rejections}
          mode={mode}
          onModeChange={setMode}
          onConfirm={handleConfirmClicked}
          onCancel={reset}
        />
      ) : null}

      {step === 'restoring' ? (
        <div role="status" aria-live="polite">
          {progress ? (
            <ProgressBar
              current={progress.done}
              target={Math.max(1, progress.total)}
              label={t('backup.restoringProgress', {
                section: formatBackupSectionLabel(progress.section),
                done: progress.done,
                total: progress.total,
              })}
              showCounts={false}
            />
          ) : (
            <p className="text-muted">{t('backup.restoring')}</p>
          )}
        </div>
      ) : null}

      {step === 'done' && result ? (
        <BackupReport result={result} onRestoreAnother={reset} />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t('backup.confirmReplaceTitle')}
        message={
          existing
            ? t(
                // Photos and videos are only destroyed when the zip cannot put them back.
                summary?.hasMediaFiles
                  ? 'backup.confirmReplaceMessageWithMedia'
                  : 'backup.confirmReplaceMessage',
                {
                  events: existing.events,
                  goals: existing.goals,
                  performanceGoals: existing.performanceGoals,
                  bucketListItems: existing.bucketListItems,
                },
              )
            : t('backup.confirmReplaceMessageGeneric')
        }
        confirmLabel={t('backup.confirmReplaceConfirm')}
        loading={step === 'restoring'}
        onConfirm={() => void handleRestore()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
