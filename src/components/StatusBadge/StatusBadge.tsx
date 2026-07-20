import type { EventStatus } from '../../types/Event'
import { formatEventStatusLabel } from '../../i18n/formatters'
import { readCssColor } from '../../theme'

/** Alinhado com --color-primary em globals.css */
export const PRIMARY_COLOR = '#2563eb'

const STATUS_STYLE_VARS: Record<EventStatus, { background: string; color: string; dot: string }> = {
  planned: {
    background: '--color-status-planned-bg',
    color: '--color-status-planned-fg',
    dot: '--color-status-planned-dot',
  },
  confirmed: {
    background: '--color-status-confirmed-bg',
    color: '--color-status-confirmed-fg',
    dot: '--color-status-confirmed-dot',
  },
  completed: {
    background: '--color-status-completed-bg',
    color: '--color-status-completed-fg',
    dot: '--color-status-completed-dot',
  },
  missed: {
    background: '--color-status-missed-bg',
    color: '--color-status-missed-fg',
    dot: '--color-status-missed-dot',
  },
  cancelled: {
    background: '--color-status-cancelled-bg',
    color: '--color-status-cancelled-fg',
    dot: '--color-status-cancelled-dot',
  },
}

export function statusDotColor(status: EventStatus): string {
  const dotVar = STATUS_STYLE_VARS[status].dot
  return readCssColor(dotVar, PRIMARY_COLOR)
}

type StatusBadgeProps = {
  status: EventStatus
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const vars = STATUS_STYLE_VARS[status]
  const displayLabel = label ?? formatEventStatusLabel(status)

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold"
      style={{
        backgroundColor: `var(${vars.background})`,
        color: `var(${vars.color})`,
      }}
    >
      {displayLabel}
    </span>
  )
}
