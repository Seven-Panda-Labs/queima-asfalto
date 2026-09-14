import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import medalha from '../../../assets/medalha.svg'
import { MilestoneTile } from './MilestoneTile'
import { fireConfetti } from './confetti'
import type { RaceMilestone } from '../../domain/raceMilestones'
import type { Event } from '../../types/Event'
import { celebrationVoiceSection, pickCelebrationVoice, voiceSeed } from '../../i18n/voiceCelebration'
import { toMilestoneCards } from '../../utils/milestoneCards'

type RaceCelebrationProps = {
  event: Event
  milestones: RaceMilestone[]
  returnTo: string
  onDismiss: () => void
}

/**
 * The moment a race is worth more than its time.
 *
 * Takes the place of the "result saved" toast, which said the same thing for a
 * corrected postcode as for a personal record. A race that changed nothing
 * still only gets the toast: the panel has to mean something to be worth
 * anything.
 */
export function RaceCelebration({
  event,
  milestones,
  returnTo,
  onDismiss,
}: RaceCelebrationProps) {
  const { t } = useTranslation()

  const section = celebrationVoiceSection(milestones)
  const voice = useMemo(
    () => pickCelebrationVoice(t, section, voiceSeed(event.id)),
    [event.id, section, t],
  )
  const cards = toMilestoneCards(milestones, event, t)

  useEffect(() => {
    // A record or a goal earns the full works. A mark that has already been
    // beaten, or one more round number, does not.
    void fireConfetti(section === 'record' || section === 'goal' ? 'full' : 'light')
  }, [section])

  if (milestones.length === 0) return null

  return (
    <section
      role="status"
      className="relative mt-6 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/20 via-surface to-primary/10 p-5 sm:p-6"
    >
      <img
        src={medalha}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -end-6 h-36 w-auto rotate-12 object-contain opacity-20"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-3xl leading-none tracking-wide text-foreground sm:text-4xl">
              {voice.primary}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted">{voice.secondary}</p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary"
          >
            {t('celebration.dismiss')}
          </button>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <MilestoneTile key={card.id} card={card} returnTo={returnTo} />
          ))}
        </ul>
      </div>
    </section>
  )
}
