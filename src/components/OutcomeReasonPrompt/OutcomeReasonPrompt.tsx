import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OUTCOME_REASONS, type OutcomeReason } from '../../domain/outcomeReasons'
import { saveOutcomeReason } from '../../services/events'

type OutcomeReasonPromptProps = {
  eventId: string
  /** The reason already recorded, when this is a correction rather than an answer. */
  current?: OutcomeReason
  onSaved: () => void
}

/**
 * The question the app used to answer by itself.
 *
 * A race with no time became "missed" two days later, which says the runner did
 * not show up. Often they did, and something else happened. One tap answers it.
 */
export function OutcomeReasonPrompt({ eventId, current, onSaved }: OutcomeReasonPromptProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState<OutcomeReason | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(reason: OutcomeReason) {
    setSaving(reason)
    setError(null)
    try {
      await saveOutcomeReason(eventId, reason)
      onSaved()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('errors.unknown'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">
        {current ? t('outcome.editTitle') : t('outcome.promptTitle')}
      </p>
      <p className="mt-1 text-xs text-muted">{t('outcome.promptHint')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OUTCOME_REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={saving !== null}
            onClick={() => void choose(reason)}
            className={[
              'rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50',
              reason === current
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-foreground hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            {t(`outcome.reasons.${reason}`)}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  )
}
