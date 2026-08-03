import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  formatBackupRejectReason,
  formatBackupSectionLabel,
  formatBackupWarning,
} from '../../i18n/formatters'
import { RESTORABLE_SECTIONS } from '../../services/backupFormat'
import type { BackupRestoreResult } from '../../services/backupImport'

type BackupReportProps = {
  result: BackupRestoreResult
  onRestoreAnother: () => void
}

export function BackupReport({ result, onRestoreAnother }: BackupReportProps) {
  const { t } = useTranslation()

  const touchedSections = RESTORABLE_SECTIONS.filter((section) => {
    const counts = result.sections[section]
    return counts.created + counts.updated + counts.skipped + counts.rejected > 0
  })

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-success bg-success/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('backup.doneTitle')}</h2>
        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {result.deleted ? (
            <li>
              {t('backup.reportDeleted', {
                events: result.deleted.events,
                goals: result.deleted.goals,
                performanceGoals: result.deleted.performanceGoals,
                bucketListItems: result.deleted.bucketListItems,
                eventMedia: result.deleted.eventMedia,
              })}
            </li>
          ) : null}

          {touchedSections.map((section) => {
            const counts = result.sections[section]
            return (
              <li key={section}>
                {t('backup.reportSection', {
                  section: formatBackupSectionLabel(section),
                  created: counts.created,
                  updated: counts.updated,
                  skipped: counts.skipped,
                })}
                {counts.rejected > 0 ? (
                  <span className="ml-2 text-danger">
                    {t('backup.reportRejected', {
                      section: formatBackupSectionLabel(section),
                      count: counts.rejected,
                    })}
                  </span>
                ) : null}
              </li>
            )
          })}

          {result.sharesIgnored > 0 ? (
            <li>{t('backup.reportSharesIgnored', { count: result.sharesIgnored })}</li>
          ) : null}
        </ul>
      </div>

      {result.warnings.length > 0 ? (
        <div className="rounded-lg border border-warning-border bg-warning-bg p-4">
          <h3 className="font-semibold text-warning-fg">{t('backup.warningsTitle')}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-warning-fg">
            {[...new Set(result.warnings)].map((warning) => (
              <li key={warning}>{formatBackupWarning(warning)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.errors.length > 0 ? (
        <div className="rounded-lg border border-danger bg-danger/5 p-4">
          <h3 className="font-semibold text-danger">{t('backup.partialErrors')}</h3>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.rejections.length > 0 ? (
        <details className="rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {t('backup.rejectedDetails')}
          </summary>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm text-muted">
            {result.rejections.map((rejection) => (
              <li key={`${rejection.section}-${rejection.id}`}>
                {t('backup.rejectedItem', {
                  section: formatBackupSectionLabel(rejection.section),
                  id: rejection.id,
                  reason: formatBackupRejectReason(rejection.reason),
                })}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/eventos"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t('backup.viewEvents')}
        </Link>
        <button
          type="button"
          onClick={onRestoreAnother}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface"
        >
          {t('backup.restoreAnother')}
        </button>
      </div>
    </div>
  )
}
