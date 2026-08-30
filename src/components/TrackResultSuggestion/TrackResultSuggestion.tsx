import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import type { Event } from '../../types/Event'
import type { EventTrack } from '../../types/EventTrack'
import { buildTrackTimeSuggestion, distanceDeviationPercent } from '../../utils/trackSuggestion'
import { formatPaceDelta } from '../../utils/analytics/results'

type TrackResultSuggestionProps = {
  track: EventTrack
  event: Event
  /** The current value of the editor's fields, not what is saved on the event. */
  currentTime: string
  onApplyTime: (time: string) => void
}

/** Beyond this the file probably belongs to another race, so say so. */
const SUSPICIOUS_DEVIATION_PERCENT = 5

export function TrackResultSuggestion({
  track,
  event,
  currentTime,
  onApplyTime,
}: TrackResultSuggestionProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)

  const suggestion = buildTrackTimeSuggestion(track, currentTime)
  const deviation = distanceDeviationPercent(track, event.realDistance)
  const measuredKm = (track.distanceMeters / 1000).toFixed(2)

  function applySuggestion() {
    onApplyTime(suggestion.suggestedTime)
    setConfirming(false)
  }

  return (
    <div className="mt-5 rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('trackResult.title')}
      </p>

      <p className="mt-2 text-sm text-foreground">
        {t('trackResult.measured', { time: suggestion.suggestedTime, distance: measuredKm })}
      </p>

      {deviation !== null && Math.abs(deviation) >= SUSPICIOUS_DEVIATION_PERCENT ? (
        <p className="mt-1 text-sm text-danger">
          {t('trackResult.distanceMismatch', { percent: Math.abs(deviation).toFixed(1) })}
        </p>
      ) : null}

      {suggestion.state === 'empty' ? (
        <button
          type="button"
          onClick={applySuggestion}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          {t('trackResult.useTime')}
        </button>
      ) : null}

      {suggestion.state === 'matches' ? (
        <p className="mt-2 text-sm text-success">{t('trackResult.matches')}</p>
      ) : null}

      {suggestion.state === 'differs' ? (
        <>
          <p className="mt-2 text-sm text-muted">
            {t('trackResult.differs', {
              current: suggestion.currentTime,
              delta: formatPaceDelta(suggestion.deltaSeconds),
            })}
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            {t('trackResult.replaceTime')}
          </button>
        </>
      ) : null}

      <p className="mt-3 text-xs text-muted">{t('trackResult.officialWins')}</p>

      <ConfirmDialog
        open={confirming}
        title={t('trackResult.confirmTitle')}
        message={t('trackResult.confirmMessage', {
          current: suggestion.state === 'differs' ? suggestion.currentTime : '',
          suggested: suggestion.suggestedTime,
        })}
        confirmLabel={t('trackResult.replaceTime')}
        onConfirm={applySuggestion}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
