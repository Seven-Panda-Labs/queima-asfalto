import { useTranslation } from 'react-i18next'
import { MilestoneTile } from './MilestoneTile'
import type { RaceMilestone } from '../../domain/raceMilestones'
import type { Event } from '../../types/Event'
import { toMilestoneCards } from '../../utils/milestoneCards'

type MilestoneBandProps = {
  event: Event
  milestones: RaceMilestone[]
  returnTo: string
}

/**
 * What the race marked, for as long as the race exists.
 *
 * The medal it replaces meant "this is the best today", so the day a faster
 * race came along it vanished and took the feat with it. A record that was set
 * here was still set here, and the band says so with `superseded` doing the
 * rest.
 */
export function MilestoneBand({ event, milestones, returnTo }: MilestoneBandProps) {
  const { t } = useTranslation()

  if (milestones.length === 0) return null

  const cards = toMilestoneCards(milestones, event, t)

  return (
    <section className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('celebration.bandTitle')}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <MilestoneTile key={card.id} card={card} returnTo={returnTo} />
        ))}
      </ul>
    </section>
  )
}
