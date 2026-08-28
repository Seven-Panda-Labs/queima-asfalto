import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import texturaAsfalto from '../../../assets/textura-asfalto.svg'
import type { Event } from '../../types/Event'
import { formatEventStatusLabel } from '../../i18n/formatters'
import { formatEventTypeLabel } from '../../types/Goal'
import { formatDatePt } from '../../utils/date'
import { formatDaysUntil } from '../../utils/nextEvent'

type NextEventCardProps = {
  event?: Event | null
}

/** Asfalto low poly sobre o gradiente, mais o brilho que lhe dá profundidade. */
function AsphaltDecoration() {
  return (
    <>
      <img
        src={texturaAsfalto}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute -top-24 -end-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
    </>
  )
}

function Hero({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-5 text-white shadow-lg sm:p-7">
      <AsphaltDecoration />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
          {emoji}
        </span>
        {children}
      </div>
    </div>
  )
}

export function NextEventCard({ event }: NextEventCardProps) {
  const { t } = useTranslation()
  const today = new Date()

  if (!event) {
    return (
      <Hero emoji="👟">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {t('dashboard.nextEvent')}
          </p>
          <p className="mt-1 font-display text-3xl tracking-wide sm:text-4xl">
            {t('dashboard.noUpcoming')}
          </p>
        </div>
        <Link
          to="/eventos/novo"
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
        >
          {t('common.add')}
        </Link>
      </Hero>
    )
  }

  const countdown = formatDaysUntil(event.date, today, {
    today: t('dashboard.daysUntilToday'),
    tomorrow: t('dashboard.daysUntilTomorrow'),
    other: (n: number) => t('dashboard.daysUntilOther', { count: n }),
  })

  return (
    <Hero emoji={event.emoji ?? '🏃'}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
          {t('dashboard.nextEvent')}
        </p>
        <p className="mt-0.5 font-display text-4xl leading-tight tracking-wide sm:text-5xl">
          {countdown}
        </p>
        <p className="mt-1 truncate text-base font-bold">{event.name}</p>
        <p className="text-sm text-white/75">
          {formatDatePt(event.date)} • {formatEventTypeLabel(event.eventType)} •{' '}
          {event.location || t('common.dash')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {formatEventStatusLabel(event.status)}
        </span>
        <Link
          to={`/eventos/${event.id}`}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
        >
          {t('common.view')}
        </Link>
      </div>
    </Hero>
  )
}
