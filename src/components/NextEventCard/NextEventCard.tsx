import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../StatusBadge'
import type { Event } from '../../types/Event'
import { formatEventTypeLabel } from '../../types/Goal'
import { formatDatePt } from '../../utils/date'
import { formatDaysUntil } from '../../utils/nextEvent'

type NextEventCardProps = {
  event?: Event | null
}

export function NextEventCard({ event }: NextEventCardProps) {
  const { t } = useTranslation()
  const today = new Date()
  const daysUntilLabels = {
    today: t('dashboard.daysUntilToday'),
    tomorrow: t('dashboard.daysUntilTomorrow'),
    other: (n: number) => t('dashboard.daysUntilOther', { count: n }),
  }

  if (!event) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-foreground">{t('dashboard.noUpcoming')}</p>
        <Link
          to="/eventos/novo"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {t('common.add')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="text-3xl" aria-hidden>
        {event.emoji ?? '🏃'}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-foreground">{event.name}</h2>
        <p className="mt-1 text-sm font-semibold text-primary">
          {formatDaysUntil(event.date, today, daysUntilLabels)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {formatDatePt(event.date)} • {formatEventTypeLabel(event.eventType)} •{' '}
          {event.location || t('common.dash')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={event.status} />
        <Link
          to={`/eventos/${event.id}`}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-background"
        >
          {t('common.view')}
        </Link>
      </div>
    </div>
  )
}
