import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatEventStatusLabel, formatImportSkipReason, formatEventTypeLabel } from '../../i18n/formatters'
import { formatDatePt } from '../../utils/date'
import type { ParsedGoal } from '../../services/excelGoalParser'
import type { ParsedBucketListRow } from '../../services/excelBucketListParser'
import type { ParsedRow, SkippedRow } from '../../services/excelParser'
import { formatGoalLabel } from '../../types/Goal'
import type { GoalCreate } from '../../types/Goal'

type ImportPreviewProps = {
  events: ParsedRow[]
  goals: ParsedGoal[]
  bucketListItems: ParsedBucketListRow[]
  skipped: SkippedRow[]
  skipDuplicates: boolean
  replaceExisting: boolean
  onSkipDuplicatesChange: (value: boolean) => void
  onReplaceExistingChange: (value: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const PREVIEW_LIMIT = 10

export function ImportPreview({
  events,
  goals,
  bucketListItems,
  skipped,
  skipDuplicates,
  replaceExisting,
  onSkipDuplicatesChange,
  onReplaceExistingChange,
  onConfirm,
  onCancel,
  loading = false,
}: ImportPreviewProps) {
  const { t } = useTranslation()
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [showSkipped, setShowSkipped] = useState(false)

  const visibleEvents = showAllEvents ? events : events.slice(0, PREVIEW_LIMIT)
  const withResults = events.filter((row) => row.event.time || row.event.pace).length

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="font-semibold text-foreground">
          {t('import.previewSummary', {
            events: events.length,
            withResults,
            goals: goals.length,
            bucket: bucketListItems.length,
            skipped: skipped.length,
          })}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground">{t('import.previewEventsTitle')}</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">{t('import.sheetColumn')}</th>
                <th className="px-3 py-2 font-semibold">{t('import.previewDate')}</th>
                <th className="px-3 py-2 font-semibold">{t('import.previewName')}</th>
                <th className="px-3 py-2 font-semibold">{t('import.previewStatus')}</th>
                <th className="px-3 py-2 font-semibold">{t('common.time')}</th>
                <th className="px-3 py-2 font-semibold">{t('common.pace')}</th>
                <th className="px-3 py-2 font-semibold">{t('common.classification')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((row) => (
                <tr key={`${row.sheet}-${row.row}`} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 whitespace-nowrap">{row.sheet}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDatePt(row.event.date)}</td>
                  <td className="px-3 py-2">{row.event.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatEventStatusLabel(row.event.status)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.event.time ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.event.pace ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.event.classification ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length > PREVIEW_LIMIT ? (
          <button
            type="button"
            onClick={() => setShowAllEvents((current) => !current)}
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            {showAllEvents ? t('import.showLess') : t('import.showAll', { count: events.length })}
          </button>
        ) : null}
      </section>

      {bucketListItems.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-foreground">{t('import.bucketListTitle')}</h2>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {bucketListItems.map((row) => (
              <li key={`${row.sheet}-${row.row}`}>
                {row.item.name}
                {row.item.location ? ` — ${row.item.location}` : ''}
                {row.item.disciplines.length > 0
                  ? ` (${row.item.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')})`
                  : ''}
                {row.item.targetMonth ? ` — ${row.item.targetMonth}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {goals.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-foreground">{t('import.goalsTitle')}</h2>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {goals.map((item) => (
              <li key={`${item.sheet}-${item.year}-${item.goal.eventType}`}>
                {formatGoalLabel(item.goal as GoalCreate)} ({item.year})
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skipped.length > 0 ? (
        <section>
          <button
            type="button"
            onClick={() => setShowSkipped((current) => !current)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {showSkipped ? t('import.hideSkipped', { count: skipped.length }) : t('import.showSkipped', { count: skipped.length })}
          </button>
          {showSkipped ? (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm text-muted">
              {skipped.map((row) => (
                <li key={`${row.sheet}-${row.row}`}>
                  <span className="font-semibold text-foreground">
                    {t('import.skippedRow', { sheet: row.sheet, row: row.row })}
                  </span>{' '}
                  {formatImportSkipReason(row.reason)}
                  {row.raw ? ` — ${row.raw}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => onReplaceExistingChange(e.target.checked)}
            className="rounded border-border"
          />
          {t('import.replaceAll')}
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={skipDuplicates}
            disabled={replaceExisting}
            onChange={(e) => onSkipDuplicatesChange(e.target.checked)}
            className="rounded border-border disabled:opacity-50"
          />
          {t('import.skipDuplicates')}
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || (events.length === 0 && bucketListItems.length === 0)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? t('import.importing') : t('import.confirmImport')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
