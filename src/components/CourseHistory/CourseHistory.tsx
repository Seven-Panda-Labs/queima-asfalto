import { useTranslation } from 'react-i18next'
import type { CourseHistory as CourseHistoryData } from '../../utils/analytics/course'
import { formatDatePt } from '../../utils/date'
import { formatPaceDelta, formatPaceSeconds } from '../../utils/analytics/results'

type CourseHistoryProps = {
  history: CourseHistoryData
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
export function CourseHistory({ history }: CourseHistoryProps) {
  const { t } = useTranslation()
  const { current, best, previous, runs } = history

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
