import { useTranslation } from 'react-i18next'
import type { CourseComparison } from '../../utils/analytics/course'
import { formatDatePt } from '../../utils/date'
import {
  formatDurationSeconds,
  formatPaceDelta,
  formatPaceSeconds,
} from '../../utils/analytics/results'

type CourseHistoryProps = {
  comparison: CourseComparison
}

function Row({
  label,
  pace,
  date,
  note,
}: {
  label: string
  pace: string
  date: string
  note?: string
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-foreground">
        <span className="font-semibold">{pace}</span>
        <span className="ms-2 text-muted">{date}</span>
        {note ? <span className="ms-2 text-muted">{note}</span> : null}
      </span>
    </div>
  )
}

/**
 * Ranks this running of a course against the others.
 *
 * Pace, not time: the same course is not always measured at the same distance,
 * and a time comparison would reward the year it came up short.
 */
export function CourseHistory({ comparison }: CourseHistoryProps) {
  const { t } = useTranslation()
  const { best, runs } = comparison

  if (comparison.kind === 'upcoming') {
    return (
      <section className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('courseHistory.title')}</h2>
        <p className="mt-1 text-sm text-muted">
          {t('courseHistory.subtitleUpcoming', { count: runs.length })}
        </p>

        <div className="mt-4">
          <Row
            label={t('courseHistory.toBeat')}
            pace={formatPaceSeconds(best.result.paceSeconds)}
            date={formatDatePt(best.result.date)}
          />
          {comparison.latest.result.event.id === best.result.event.id ? null : (
            <Row
              label={t('courseHistory.lastTime')}
              pace={formatPaceSeconds(comparison.latest.result.paceSeconds)}
              date={formatDatePt(comparison.latest.result.date)}
            />
          )}
        </div>

        <p className="mt-4 rounded-md bg-background px-3 py-2 text-sm text-foreground">
          {t('courseHistory.target', {
            time: formatDurationSeconds(comparison.targetSeconds),
          })}
        </p>
        <p className="mt-3 text-xs text-muted">{t('courseHistory.targetNote')}</p>
      </section>
    )
  }

  const { current, previous } = comparison
  const isBest = current.rank === 1

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">{t('courseHistory.title')}</h2>
      <p className="mt-1 text-sm text-muted">
        {t('courseHistory.subtitle', { count: runs.length })}
      </p>

      <div className="mt-4">
        <Row
          label={t('courseHistory.thisRun')}
          pace={formatPaceSeconds(current.result.paceSeconds)}
          date={formatDatePt(current.result.date)}
          note={
            isBest
              ? t('courseHistory.bestEver')
              : t('courseHistory.rank', { rank: current.rank, total: runs.length })
          }
        />

        {isBest ? null : (
          <Row
            label={t('courseHistory.best')}
            pace={formatPaceSeconds(best.result.paceSeconds)}
            date={formatDatePt(best.result.date)}
            note={formatPaceDelta(current.result.paceSeconds - best.result.paceSeconds)}
          />
        )}

        {previous ? (
          <Row
            label={t('courseHistory.previous')}
            pace={formatPaceSeconds(previous.result.paceSeconds)}
            date={formatDatePt(previous.result.date)}
            note={formatPaceDelta(current.result.paceSeconds - previous.result.paceSeconds)}
          />
        ) : null}
      </div>

      <p className="mt-3 text-xs text-muted">{t('courseHistory.paceNote')}</p>
    </section>
  )
}
