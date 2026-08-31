import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import corredorMontanha from '../../../assets/empty-hero.webp'
import texturaAsfalto from '../../../assets/textura-asfalto.svg'
import type { Event } from '../../types/Event'
import { formatEventStatusLabel } from '../../i18n/formatters'
import { formatEventTypeLabel } from '../../types/Goal'
import { formatDatePt } from '../../utils/date'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { formatDaysUntil } from '../../utils/nextEvent'

export type NextEventTarget = {
  /** The best pace on this course, carried over the distance ahead. */
  targetSeconds: number
  paceSeconds: number
  /** How many times the course has been run before. */
  runs: number
}

type NextEventCardProps = {
  event?: Event | null
  /** Only for a course already run: there is nothing to beat otherwise. */
  target?: NextEventTarget | null
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

/**
 * Sem próximo evento não há contagem decrescente para mostrar, por isso o
 * espaço vai todo para a ilustração e para o convite a marcar o próximo.
 * A ilustração fica numa coluna em vez de fundo inteiro: cortada à largura
 * do herói, o corredor perderia sempre a cabeça.
 */
function EmptyHero() {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg">
      <div className="flex flex-col sm:h-64 sm:flex-row">
        <div className="order-2 flex flex-1 flex-col justify-center p-6 sm:order-1 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {t('dashboard.nextEvent')}
          </p>
          <p className="mt-0.5 font-display text-4xl leading-tight tracking-wide">
            {t('dashboard.noUpcomingTitle')}
          </p>
          <p className="mt-2 text-sm text-white/75">{t('dashboard.noUpcoming')}</p>
          <Link
            to="/eventos/novo"
            className="mt-5 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
          >
            {t('common.add')}
          </Link>
        </div>

        <div className="relative order-1 h-44 sm:order-2 sm:h-auto sm:w-[46%]">
          <img
            src={corredorMontanha}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
          {/* Esbate a costura com o gradiente do cartão: em baixo no telemóvel, ao lado no ecrã largo. */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary to-transparent sm:hidden"
            aria-hidden
          />
          <div
            className="absolute inset-y-0 start-0 hidden w-1/2 bg-gradient-to-r from-primary to-transparent sm:block rtl:bg-gradient-to-l"
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}

export function NextEventCard({ event, target }: NextEventCardProps) {
  const { t } = useTranslation()
  const today = new Date()

  if (!event) return <EmptyHero />

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
        {target ? (
          <p className="mt-3 inline-flex flex-wrap items-baseline gap-x-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <span>
              {t('dashboard.courseTarget', {
                time: formatDurationSeconds(target.targetSeconds),
                pace: formatPaceSeconds(target.paceSeconds),
              })}
            </span>
            <span className="font-normal text-white/75">
              {t('dashboard.courseTargetRuns', { count: target.runs })}
            </span>
          </p>
        ) : null}
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
