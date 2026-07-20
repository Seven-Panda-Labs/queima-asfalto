import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatImportSkipReason } from '../../i18n/formatters'
import type { ImportResult } from '../../services/import'
import type { SkippedRow } from '../../services/excelParser'

type ImportReportProps = {
  result: ImportResult
  skipped: SkippedRow[]
  onImportAnother: () => void
}

export function ImportReport({ result, skipped, onImportAnother }: ImportReportProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-success bg-success/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('import.doneTitle')}</h2>
        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {result.eventsDeleted > 0 || result.goalsDeleted > 0 || result.bucketListDeleted > 0 ? (
            <li>
              {t('import.reportDeleted', {
                events: result.eventsDeleted,
                goals: result.goalsDeleted,
                bucket: result.bucketListDeleted,
              })}
            </li>
          ) : null}
          <li>{t('import.reportEventsCreated', { count: result.eventsCreated })}</li>
          <li>{t('import.reportEventsSkipped', { count: result.eventsSkipped })}</li>
          <li>{t('import.reportGoalsCreated', { count: result.goalsCreated })}</li>
          <li>{t('import.reportGoalsSkipped', { count: result.goalsSkipped })}</li>
          <li>{t('import.reportBucketCreated', { count: result.bucketListCreated })}</li>
          <li>{t('import.reportBucketSkipped', { count: result.bucketListSkipped })}</li>
          {skipped.length > 0 ? (
            <li>{t('import.reportParseSkipped', { count: skipped.length })}</li>
          ) : null}
        </ul>
      </div>

      {result.errors.length > 0 ? (
        <div className="rounded-lg border border-danger bg-danger/5 p-4">
          <h3 className="font-semibold text-danger">{t('import.partialErrors')}</h3>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {skipped.length > 0 ? (
        <details className="rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {t('import.skippedDetails')}
          </summary>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm text-muted">
            {skipped.map((row) => (
              <li key={`${row.sheet}-${row.row}`}>
                {t('import.skippedRowDetail', {
                  sheet: row.sheet,
                  row: row.row,
                  reason: formatImportSkipReason(row.reason),
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
          {t('import.viewEvents')}
        </Link>
        <button
          type="button"
          onClick={onImportAnother}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface"
        >
          {t('import.importAnother')}
        </button>
      </div>
    </div>
  )
}
