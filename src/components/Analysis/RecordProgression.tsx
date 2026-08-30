import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PersonalRecordIndicator } from '../PersonalRecordIndicator/PersonalRecordIndicator'
import type { RecordProgression as Progression } from '../../utils/analytics/records'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatDatePt, formatRelativeTimePt } from '../../utils/date'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'

type RecordProgressionProps = {
  progressions: Progression[]
  returnTo: string
  ownerId: string | null
}

/** A list, not a chart: with two or three marks per discipline a step chart would be a near-straight line, and the dates are the point. */
export function RecordProgression({ progressions, returnTo, ownerId }: RecordProgressionProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px overflow-hidden rounded-xl border border-border bg-border">
      {progressions.map((progression) => (
        <div key={progression.eventType} className="bg-surface px-4 py-4">
          <div className="flex items-center gap-2">
            <PersonalRecordIndicator />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {formatEventTypeLabel(progression.eventType)}
            </p>
          </div>

          <p className="mt-2 font-display text-2xl leading-none tracking-wide text-foreground">
            {formatDurationSeconds(progression.current.result.timeSeconds)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {formatPaceSeconds(progression.current.result.paceSeconds)} {t('common.paceUnit')} ·{' '}
            {formatRelativeTimePt(progression.current.result.date)}
          </p>

          <ol className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
            {progression.marks
              .slice()
              .reverse()
              .map((mark) => (
                <li key={mark.result.event.id} className="flex items-baseline justify-between gap-2">
                  <Link
                    to={buildEventDetailPath(mark.result.event.id, { ownerId, returnTo })}
                    state={eventLinkState(returnTo).state}
                    className="truncate text-muted underline-offset-2 hover:text-primary hover:underline"
                  >
                    {formatDatePt(mark.result.date)} · {mark.result.event.name}
                  </Link>
                  <span
                    className={
                      mark.improvementSeconds === null
                        ? 'shrink-0 text-muted'
                        : 'shrink-0 font-semibold text-success'
                    }
                  >
                    {mark.improvementSeconds === null
                      ? t('analysis.firstRecord')
                      : `-${formatPaceSeconds(mark.improvementSeconds)}`}
                  </span>
                </li>
              ))}
          </ol>

          {progression.marks.length > 1 ? (
            <p className="mt-2 text-xs text-muted">
              {t('analysis.recordsFell', { count: progression.marks.length })}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
