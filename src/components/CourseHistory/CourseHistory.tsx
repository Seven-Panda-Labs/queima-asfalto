import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { CourseComparison, CourseRun } from '../../utils/analytics/course'
import { formatDatePt } from '../../utils/date'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'
import {
  formatDurationSeconds,
  formatPaceDelta,
  formatPaceSeconds,
} from '../../utils/analytics/results'

type CourseHistoryProps = {
  comparison: CourseComparison
  returnTo: string
}

function Row({
  label,
  value,
  run,
  returnTo,
  note,
}: {
  label: string
  value: string
  run: CourseRun
  /** Left out for the race being viewed, which needs no link to itself. */
  returnTo?: string
  note?: string
}) {
  const date = formatDatePt(run.result.date)
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-foreground">
        <span className="font-semibold">{value}</span>
        {returnTo ? (
          <Link
            to={buildEventDetailPath(run.result.event.id, { returnTo })}
            state={eventLinkState(returnTo).state}
            className="ms-2 text-primary hover:underline"
          >
            {date}
          </Link>
        ) : (
          <span className="ms-2 text-muted">{date}</span>
        )}
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
export function CourseHistory({ comparison, returnTo }: CourseHistoryProps) {
  const { t } = useTranslation()
  const { best, runs } = comparison

  // The target is a time, so a past running shows the time it took too.
  const result = (run: CourseRun) =>
    t('courseHistory.result', {
      time: formatDurationSeconds(run.result.timeSeconds),
      pace: formatPaceSeconds(run.result.paceSeconds),
    })
  const pace = (run: CourseRun) =>
    t('courseHistory.pace', { pace: formatPaceSeconds(run.result.paceSeconds) })

  if (comparison.kind === 'upcoming') {
    return (
      <section className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('courseHistory.title')}</h2>
        <p className="mt-1 text-sm text-muted">
          {t('courseHistory.subtitleUpcoming', { count: runs.length })}
        </p>

        <div className="mt-4">
          <Row label={t('courseHistory.best')} value={result(best)} run={best} returnTo={returnTo} />
          {comparison.latest.result.event.id === best.result.event.id ? null : (
            <Row
              label={t('courseHistory.lastTime')}
              value={result(comparison.latest)}
              run={comparison.latest}
              returnTo={returnTo}
            />
          )}
        </div>

        <p className="mt-4 rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground">
          {t('dashboard.courseTarget', {
            time: formatDurationSeconds(comparison.targetSeconds),
            pace: formatPaceSeconds(best.result.paceSeconds),
          })}
        </p>
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
          value={pace(current)}
          run={current}
          note={
            isBest
              ? t('courseHistory.bestEver')
              : t('courseHistory.rank', { rank: current.rank, total: runs.length })
          }
        />

        {isBest ? null : (
          <Row
            label={t('courseHistory.best')}
            value={pace(best)}
            run={best}
            returnTo={returnTo}
            note={formatPaceDelta(current.result.paceSeconds - best.result.paceSeconds)}
          />
        )}

        {previous ? (
          <Row
            label={t('courseHistory.previous')}
            value={pace(previous)}
            run={previous}
            returnTo={returnTo}
            note={formatPaceDelta(current.result.paceSeconds - previous.result.paceSeconds)}
          />
        ) : null}
      </div>
    </section>
  )
}
