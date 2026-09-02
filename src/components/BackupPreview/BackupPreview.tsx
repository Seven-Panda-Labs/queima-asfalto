import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBackupRejectReason, formatBackupSectionLabel, formatBackupWarning } from '../../i18n/formatters'
import type {
  BackupRestoreMode,
  BackupRestoreWarning,
  BackupSummary,
} from '../../services/backupImport'
import type { BackupManifest, BackupSectionKey, RestoreRejection } from '../../services/backupFormat'

const COUNT_KEYS: Record<Exclude<BackupSectionKey, 'userProfile'>, string> = {
  events: 'backup.countEvents',
  eventMedia: 'backup.countEventMedia',
  eventTracks: 'backup.countEventTracks',
  goals: 'backup.countGoals',
  performanceGoals: 'backup.countPerformanceGoals',
  bucketListItems: 'backup.countBucketListItems',
  races: 'backup.countRaces',
  raceEntries: 'backup.countRaceEntries',
  shares: 'backup.countShares',
}

/** Sections whose existing counts are known, so the preview can show a diff. */
export type ExistingCounts = Record<
  'events' | 'goals' | 'performanceGoals' | 'bucketListItems',
  number
>

type BackupPreviewProps = {
  manifest: BackupManifest
  summary: BackupSummary
  existing: ExistingCounts | null
  rejections: RestoreRejection[]
  mode: BackupRestoreMode
  onModeChange: (mode: BackupRestoreMode) => void
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

function hasExisting(section: string, existing: ExistingCounts | null): existing is ExistingCounts {
  return existing !== null && section in existing
}

export function BackupPreview({
  manifest,
  summary,
  existing,
  rejections,
  mode,
  onModeChange,
  onConfirm,
  onCancel,
  loading = false,
}: BackupPreviewProps) {
  const { t } = useTranslation()
  const [showRejected, setShowRejected] = useState(false)

  const exportedAt = manifest.exportedAt ? new Date(manifest.exportedAt) : null
  const nothingToRestore = summary.restorableTotal === 0

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-base font-semibold text-foreground">{t('backup.previewTitle')}</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {exportedAt && !Number.isNaN(exportedAt.getTime()) ? (
            <li>{t('backup.previewExportedAt', { date: exportedAt.toLocaleString() })}</li>
          ) : null}
          {manifest.appVersion ? (
            <li>{t('backup.previewAppVersion', { version: manifest.appVersion })}</li>
          ) : null}
          <li>{t('backup.previewSchemaVersion', { version: manifest.schemaVersion })}</li>
        </ul>

        <ul className="mt-4 space-y-1 text-sm text-foreground">
          {(Object.keys(COUNT_KEYS) as Array<keyof typeof COUNT_KEYS>).map((section) => {
            const count = summary.counts[section]
            if (count === 0) return null

            const showDiff = mode === 'merge' && hasExisting(section, existing)
            return (
              <li key={section}>
                {t(COUNT_KEYS[section], { count })}
                {showDiff ? (
                  <span className="ms-2 text-muted">
                    {t('backup.previewDiff', {
                      created: Math.max(0, count - existing[section as keyof ExistingCounts]),
                      updated: Math.min(count, existing[section as keyof ExistingCounts]),
                    })}
                  </span>
                ) : null}
              </li>
            )
          })}
          {summary.counts.userProfile > 0 ? <li>{t('backup.countUserProfile')}</li> : null}
          {summary.hasMediaFiles ? (
            <li className="text-success">
              {t('backup.countMediaFiles', {
                count: summary.mediaFileCount,
                mb: Math.max(1, Math.round(summary.mediaFileBytes / (1024 * 1024))),
              })}
            </li>
          ) : null}
        </ul>

        {mode === 'merge' && existing === null ? (
          <p className="mt-2 text-xs text-muted">{t('backup.existingLoading')}</p>
        ) : null}

        {nothingToRestore ? (
          <p className="mt-3 text-sm text-danger">{t('backup.previewNothingToRestore')}</p>
        ) : null}
      </div>

      {(() => {
        const warnings = visibleWarnings(summary, mode)
        if (warnings.length === 0) return null
        return (
          <div className="rounded-lg border border-warning-border bg-warning-bg p-4">
            <h3 className="font-semibold text-warning-fg">{t('backup.warningsTitle')}</h3>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-warning-fg">
              {warnings.map((warning) => (
                <li key={warning}>{formatBackupWarning(warning)}</li>
              ))}
            </ul>
          </div>
        )
      })()}

      {rejections.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowRejected((value) => !value)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {showRejected
              ? t('backup.hideRejected', { count: rejections.length })
              : t('backup.showRejected', { count: rejections.length })}
          </button>
          {showRejected ? (
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-muted">
              {rejections.map((rejection) => (
                <li key={`${rejection.section}-${rejection.id}`}>
                  {t('backup.rejectedItem', {
                    section: formatBackupSectionLabel(rejection.section),
                    id: rejection.id,
                    reason: formatBackupRejectReason(rejection.reason),
                  })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">{t('backup.modeTitle')}</legend>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="backup-restore-mode"
            value="merge"
            checked={mode === 'merge'}
            onChange={() => onModeChange('merge')}
            aria-describedby="backup-mode-merge-hint"
            className="mt-1 border-border"
          />
          <span>
            {t('backup.modeMerge')}
            <span id="backup-mode-merge-hint" className="block text-xs text-muted">
              {t('backup.modeMergeHint')}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="backup-restore-mode"
            value="replace"
            checked={mode === 'replace'}
            onChange={() => onModeChange('replace')}
            aria-describedby="backup-mode-replace-hint"
            className="mt-1 border-border"
          />
          <span>
            <span className="font-semibold text-danger">{t('backup.modeReplace')}</span>
            <span id="backup-mode-replace-hint" className="block text-xs text-muted">
              {summary.hasMediaFiles
                ? t('backup.modeReplaceHintWithMedia')
                : t('backup.modeReplaceHint')}
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || nothingToRestore}
          className={[
            'rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
            mode === 'replace' ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-primary-hover',
          ].join(' ')}
        >
          {mode === 'replace' ? t('backup.confirmReplaceConfirm') : t('backup.confirmRestore')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground disabled:opacity-60"
        >
          {t('backup.cancel')}
        </button>
      </div>
    </div>
  )
}

/**
 * Replace mode only destroys photos and videos when the zip cannot put them
 * back, so that warning is conditional on both the mode and the zip's contents.
 */
function visibleWarnings(
  summary: BackupSummary,
  mode: BackupRestoreMode,
): BackupRestoreWarning[] {
  const extra: BackupRestoreWarning[] =
    mode === 'replace' && !summary.hasMediaFiles && summary.counts.eventMedia > 0
      ? ['media_not_restored_replace_mode']
      : []
  return [...new Set([...summary.warnings, ...extra])]
}
