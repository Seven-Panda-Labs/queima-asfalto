import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/Event'
import { formatDatePt } from '../../utils/date'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'

type UnmappedEventsPanelProps = {
  events: Event[]
  readOnly?: boolean
  ownerId?: string | null
  returnTo?: string
}

export function UnmappedEventsPanel({
  events,
  readOnly = false,
  ownerId = null,
  returnTo = '/eventos',
}: UnmappedEventsPanelProps) {
  const { t } = useTranslation()

  if (events.length === 0) return null

  return (
    <aside className="w-full rounded-lg border border-border bg-surface p-4 lg:max-w-md">
      <h3 className="text-sm font-semibold text-foreground">{t('eventMap.unmappedTitle')}</h3>
      <p className="mt-1 text-xs text-muted">{t('eventMap.unmappedHint')}</p>
      <ul className="mt-3 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{event.name}</p>
            <p className="text-xs text-muted">
              {formatDatePt(event.date)} · {event.location || t('common.dash')}
            </p>
            {readOnly ? (
              ownerId ? (
                <Link
                  to={buildEventDetailPath(event.id, { ownerId, returnTo })}
                  state={eventLinkState(returnTo).state}
                  className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  {t('common.view')}
                </Link>
              ) : null
            ) : (
              <Link
                to={`/eventos/${event.id}/editar`}
                className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
              >
                {t('eventMap.editLocation')}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
