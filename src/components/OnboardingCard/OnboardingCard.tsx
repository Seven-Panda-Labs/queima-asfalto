import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  onboardingProgress,
  onboardingStepPath,
  onboardingSteps,
  type OnboardingFacts,
  type OnboardingStepId,
} from '../../domain/onboarding'

type OnboardingCardProps = {
  facts: OnboardingFacts
  /** The anchor's item, so the entry step lands on the right race. */
  anchorItemId?: string
  onDismiss: () => void
}

function Tick({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
        done ? 'border-success bg-success/15 text-success' : 'border-border text-muted',
      ].join(' ')}
    >
      {done ? '✓' : ''}
    </span>
  )
}

/**
 * The first session, as a list that stays.
 *
 * A first-run screen teaches once and is then gone, and a checklist that only
 * names the steps teaches nothing. So each row carries the reason: what the app
 * does with this once it has it. The card leaves when the four steps are done,
 * or when the runner says so.
 */
export function OnboardingCard({ facts, anchorItemId, onDismiss }: OnboardingCardProps) {
  const { t } = useTranslation()
  const steps = onboardingSteps(facts)
  const progress = onboardingProgress(facts)

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          {t('onboarding.title')}
        </h2>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('onboarding.progress', { done: progress.done, total: progress.total })}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">{t('onboarding.subtitle')}</p>

      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-3">
            <Tick done={step.done} />
            <div className="min-w-0">
              <p
                className={[
                  'text-sm font-semibold',
                  step.done ? 'text-muted line-through' : 'text-foreground',
                ].join(' ')}
              >
                {t(`onboarding.steps.${step.id as OnboardingStepId}.title`)}
              </p>
              {step.done ? null : (
                <>
                  <p className="mt-0.5 text-xs text-muted">
                    {t(`onboarding.steps.${step.id as OnboardingStepId}.why`)}
                  </p>
                  <Link
                    to={onboardingStepPath(step.id, { anchorItemId })}
                    className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    {t(`onboarding.steps.${step.id as OnboardingStepId}.action`)}
                  </Link>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 text-xs font-semibold text-muted hover:text-foreground"
      >
        {t('onboarding.dismiss')}
      </button>
    </section>
  )
}
