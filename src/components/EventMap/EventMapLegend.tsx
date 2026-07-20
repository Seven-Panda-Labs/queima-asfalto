import { useTranslation } from 'react-i18next'
import { EVENT_STATUSES } from '../../types/Event'
import { formatEventStatusLabel } from '../../i18n/formatters'
import { statusDotColor } from '../StatusBadge'

export function EventMapLegend() {
  const { t } = useTranslation()

  return (
    <aside
      className="border-t border-border bg-surface p-4 lg:w-44 lg:shrink-0 lg:border-t-0 lg:border-l"
      aria-label={t('eventMap.legendTitle')}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t('eventMap.legendTitle')}
      </h3>
      <ul className="mt-3 space-y-2">
        {EVENT_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm text-foreground">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: statusDotColor(status) }}
              aria-hidden
            />
            <span>{formatEventStatusLabel(status)}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
