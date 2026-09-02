import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { DataQuality } from '../../utils/analytics/dataQuality'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'
import { formatDatePt } from '../../utils/date'

type DataQualityNoteProps = {
  quality: DataQuality
  returnTo: string
  ownerId: string | null
  /** A shared view does not ask anyone to fix someone else's data. */
  readOnly: boolean
}

/** Above this, a count reads better than a list. */
const LISTED_EXCLUSIONS = 5

/** A footnote, not a section: it qualifies the blocks above rather than answering a question of its own. */
export function DataQualityNote({
  quality,
  returnTo,
  ownerId,
  readOnly,
}: DataQualityNoteProps) {
  const { t } = useTranslation()

  const listed = quality.excluded.slice(0, LISTED_EXCLUSIONS)
  const hidden = quality.excluded.length - listed.length

  return (
    <div className="border-t border-border pt-4 text-xs text-muted">
      <p>
        {t('analysis.qualityCounts', {
          analysable: quality.analysable,
          completed: quality.completed,
        })}{' '}
        {t('analysis.qualityVerified', { percent: quality.verifiedPercent })}
        {quality.missingClassification > 0
          ? ` ${t('analysis.qualityMissingClassification', {
              count: quality.missingClassification,
            })}`
          : ''}
        {quality.dnf > 0 ? ` ${t('analysis.qualityDnf', { count: quality.dnf })}` : ''}
      </p>

      {quality.excluded.length > 0 ? (
        <p className="mt-1">
          {t('analysis.qualityExcluded', { count: quality.excluded.length })}{' '}
          {listed.map((event, position) => (
            <Fragment key={event.id}>
              {position > 0 ? ' · ' : ''}
              {readOnly ? (
                <span>
                  {event.name} ({formatDatePt(event.date)})
                </span>
              ) : (
                <Link
                  to={buildEventDetailPath(event.id, { ownerId, returnTo })}
                  state={eventLinkState(returnTo).state}
                  className="underline-offset-2 hover:text-primary hover:underline"
                >
                  {event.name} ({formatDatePt(event.date)})
                </Link>
              )}
            </Fragment>
          ))}
          {hidden > 0 ? ` · ${t('analysis.qualityMore', { count: hidden })}` : ''}
        </p>
      ) : null}
    </div>
  )
}
