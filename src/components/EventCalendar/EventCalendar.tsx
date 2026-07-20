import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/Event'
import { eventLinkState, buildEventDetailPath } from '../../utils/eventNavigation'
import { StatusBadge, statusDotColor } from '../StatusBadge'
import {
  addMonths,
  buildCalendarDays,
  formatMonthYear,
  getWeekdays,
  isSameDay,
  startOfMonth,
} from '../../utils/calendarDays'
import { formatDatePt } from '../../utils/date'
import { dateKey, getEventsForDate, groupEventsByDay } from '../../utils/eventsByDay'

type EventCalendarProps = {
  events: Event[]
  initialMonth?: Date
  returnTo?: string
  readOnly?: boolean
  ownerId?: string | null
}

function DayEventsPanel({
  date,
  events,
  returnTo,
  readOnly = false,
  ownerId = null,
}: {
  date: Date
  events: Event[]
  returnTo: string
  readOnly?: boolean
  ownerId?: string | null
}) {
  const { t } = useTranslation()

  return (
    <section
      className="mt-4 rounded-lg border border-border bg-background p-4"
      aria-label={t('calendar.eventsOn', { date: formatDatePt(date) })}
    >
      <h3 className="text-sm font-semibold text-foreground">{formatDatePt(date)}</h3>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t('calendar.noEventsDay')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              {readOnly && !ownerId ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-2 py-2 text-sm sm:py-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusDotColor(event.status) }}
                    aria-hidden
                  />
                  {event.emoji ? <span aria-hidden>{event.emoji}</span> : null}
                  <span className="font-semibold text-foreground">{event.name}</span>
                  <StatusBadge status={event.status} />
                </div>
              ) : (
                <Link
                  to={buildEventDetailPath(event.id, { ownerId, returnTo })}
                  state={eventLinkState(returnTo).state}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface sm:py-1.5"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusDotColor(event.status) }}
                    aria-hidden
                  />
                  {event.emoji ? <span aria-hidden>{event.emoji}</span> : null}
                  <span className="font-semibold text-foreground">{event.name}</span>
                  <StatusBadge status={event.status} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function EventCalendar({
  events,
  initialMonth,
  returnTo = '/eventos',
  readOnly = false,
  ownerId = null,
}: EventCalendarProps) {
  const { t } = useTranslation()
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(initialMonth ?? today))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events])
  const monthLabel = formatMonthYear(viewMonth)
  const weekdays = getWeekdays()
  const selectedDayEvents = selectedDate ? getEventsForDate(events, selectedDate) : []

  function handleDaySelect(day: Date) {
    setSelectedDate((current) => (current && isSameDay(current, day) ? null : day))
  }

  return (
    <div>
      <div className="rounded-lg border border-border bg-surface p-2 sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label={t('calendar.prevMonth')}
            onClick={() => setViewMonth((current) => addMonths(current, -1))}
            className="rounded-md px-2 py-1 text-lg text-muted hover:bg-background hover:text-foreground"
          >
            ‹
          </button>
          <p className="text-sm font-semibold capitalize text-foreground">{monthLabel}</p>
          <button
            type="button"
            aria-label={t('calendar.nextMonth')}
            onClick={() => setViewMonth((current) => addMonths(current, 1))}
            className="rounded-md px-2 py-1 text-lg text-muted hover:bg-background hover:text-foreground"
          >
            ›
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[0.65rem] font-semibold text-muted sm:mt-3 sm:gap-1 sm:text-xs">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-0.5 sm:gap-1" role="grid" aria-label={t('calendar.gridLabel', { month: monthLabel })}>
          {buildCalendarDays(viewMonth).map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} aria-hidden role="gridcell" />
            }

            const isToday = isSameDay(day, today)
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const dayKey = dateKey(day)
            const dayEvents = eventsByDay.get(dayKey) ?? []

            return (
              <button
                key={day.toISOString()}
                type="button"
                role="gridcell"
                aria-label={t('calendar.dayAria', {
                  day: day.getDate(),
                  month: monthLabel,
                  events:
                    dayEvents.length > 0
                      ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`
                      : '',
                })}
                aria-selected={isSelected}
                onClick={() => handleDaySelect(day)}
                className={[
                  'flex min-h-11 min-w-0 flex-col items-center justify-start gap-0.5 rounded-md px-0.5 py-1 text-xs transition-colors sm:min-h-10 sm:text-sm',
                  isSelected
                    ? 'bg-primary font-semibold text-white hover:bg-primary-hover'
                    : 'text-foreground hover:bg-background',
                  isToday && !isSelected ? 'ring-1 ring-primary/40' : '',
                ].join(' ')}
              >
                <span>{day.getDate()}</span>
                {dayEvents.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-0.5" aria-hidden>
                    {dayEvents.map((event) => (
                      <span
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.9)'
                            : statusDotColor(event.status),
                        }}
                        title={event.name}
                      />
                    ))}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate ? (
        <DayEventsPanel
          date={selectedDate}
          events={selectedDayEvents}
          returnTo={returnTo}
          readOnly={readOnly}
          ownerId={ownerId}
        />
      ) : null}
    </div>
  )
}
