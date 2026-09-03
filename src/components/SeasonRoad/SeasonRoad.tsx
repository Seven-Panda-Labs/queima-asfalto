import { Link } from 'react-router-dom'

/**
 * Where you came from, where you are, where you are going.
 *
 * Three stops at most, and that cap is the design: every race between the next
 * one and the target would make a road nobody can read, and the two that carry
 * the meaning are the last result and the season's target.
 *
 * It lives on the dark hero, so every colour here is white at an opacity. The
 * road behind you is faint and solid, the road ahead is brighter and dashed:
 * one is done, the other is the part that still has to be run.
 */
export type RoadStop = {
  /** Small label above the marker. */
  kicker: string
  /** The race, left out for the stop the hero is already about. */
  name?: string
  meta?: string
  /** Where the marker links, when it is a race with a page. */
  href?: string
  kind: 'done' | 'here' | 'target'
}

/**
 * Half the marker's width plus a little air, so the road stops at its edge.
 *
 * The markers are translucent white on a translucent white road: drawing the
 * line under one of them showed through it, and the overlap read as a mistake.
 */
const MARKER_GAP: Record<RoadStop['kind'], number> = { done: 9, here: 14, target: 18 }

function Marker({ kind }: { kind: RoadStop['kind'] }) {
  if (kind === 'target') {
    return (
      <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-primary shadow-sm">
        🏁
      </span>
    )
  }
  if (kind === 'here') {
    return (
      <span className="relative z-10 h-4 w-4 rounded-full border-2 border-white bg-white ring-4 ring-white/25" />
    )
  }
  return <span className="relative z-10 h-2.5 w-2.5 rounded-full bg-white/50" />
}

export function SeasonRoad({ stops }: { stops: RoadStop[] }) {
  if (stops.length < 2) return null

  return (
    // A panel and not a rule: the countdown above is one thing, the season is
    // another, and a slightly darker inset says so without a second card.
    <ol className="flex items-start rounded-xl bg-black/15 px-3 py-3 ring-1 ring-inset ring-white/10 sm:px-5">
      {stops.map((stop, index) => {
        // Each stop draws its own half of the road on either side, so the line
        // is continuous whether there are two stops or three. Which half is
        // which comes from the runner's own position, not from the order: the
        // stretch up to "here" is behind you and solid, and everything past it
        // is dashed, because it has not been run yet.
        const here = stops.findIndex((candidate) => candidate.kind === 'here')
        const line = 'absolute top-1/2 h-px -translate-y-1/2'
        const done = 'bg-white/60'
        const todo = 'border-t border-dashed border-white/40'
        const left = index > 0 ? (index <= here ? done : todo) : null
        const right = index < stops.length - 1 ? (index < here ? done : todo) : null
        const gap = MARKER_GAP[stop.kind]
        // Logical properties, because Arabic reads the road the other way.
        const leftHalf = { insetInlineStart: 0, width: `calc(50% - ${gap}px)` }
        const rightHalf = {
          insetInlineStart: `calc(50% + ${gap}px)`,
          width: `calc(50% - ${gap}px)`,
        }
        const content = (
          <>
            <p
              className={`truncate text-[11px] font-semibold uppercase tracking-widest ${
                stop.kind === 'target' ? 'text-white' : 'text-white/60'
              }`}
            >
              {stop.kicker}
            </p>
            <div className="relative mt-1.5 flex h-6 items-center justify-center">
              {left ? <span className={`${line} ${left}`} style={leftHalf} aria-hidden /> : null}
              {right ? (
                <span className={`${line} ${right}`} style={rightHalf} aria-hidden />
              ) : null}
              <Marker kind={stop.kind} />
            </div>
            {/* Wrapped rather than truncated: on a phone the third of the width
                that a target race gets would cut its name in half, and the
                target is the half of the road that has to be legible. */}
            {stop.name ? (
              <p className="mt-1 line-clamp-2 text-sm font-bold leading-tight">{stop.name}</p>
            ) : null}
            {stop.meta ? <p className="text-xs leading-tight text-white/70">{stop.meta}</p> : null}
          </>
        )

        return (
          <li key={`${stop.kicker}-${index}`} className="min-w-0 flex-1 text-center">
            {stop.href ? (
              <Link to={stop.href} className="block rounded-lg transition hover:bg-white/10">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
