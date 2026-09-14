import { Link } from 'react-router-dom'
import type { MilestoneCard } from '../../utils/milestoneCards'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'

type MilestoneTileProps = {
  card: MilestoneCard
  returnTo: string
}

/** One mark: what it is, the number, and the context. */
export function MilestoneTile({ card, returnTo }: MilestoneTileProps) {
  return (
    <li className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none" aria-hidden>
          {card.emoji}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{card.title}</p>
      </div>

      <p className="mt-2 font-display text-2xl leading-none tracking-wide text-foreground">
        {card.value}
      </p>

      {card.detail ? <p className="mt-1 text-xs text-muted">{card.detail}</p> : null}

      {card.superseded ? (
        <p className="mt-2 text-xs text-muted">
          <Link
            to={buildEventDetailPath(card.superseded.eventId, { returnTo })}
            state={eventLinkState(returnTo).state}
            className="underline-offset-2 hover:text-primary hover:underline"
          >
            {card.superseded.label}
          </Link>
        </p>
      ) : null}
    </li>
  )
}
