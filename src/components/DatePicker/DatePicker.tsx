import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addMonths,
  buildCalendarDays,
  formatMonthYear,
  getWeekdays,
  isSameDay,
  startOfMonth,
} from '../../utils/calendarDays'
import { formatDatePt } from '../../utils/date'

type DatePickerProps = {
  id?: string
  value: Date
  onChange: (date: Date) => void
  hasError?: boolean
}

export function DatePicker({ id, value, onChange, hasError = false }: DatePickerProps) {
  const { t } = useTranslation()
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value))
  const today = new Date()

  useEffect(() => {
    setViewMonth(startOfMonth(value))
  }, [value])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const monthLabel = formatMonthYear(viewMonth)
  const weekdays = getWeekdays()

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={inputId}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex w-full items-center justify-between rounded-md border bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-background',
          hasError ? 'border-danger' : 'border-border',
        ].join(' ')}
      >
        <span>{formatDatePt(value)}</span>
        <span className="text-base" aria-hidden>
          📅
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('datePicker.chooseDate')}
          className="absolute z-20 mt-1 w-full min-w-[17.5rem] rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={t('datePicker.prevMonth')}
              onClick={() => setViewMonth((current) => addMonths(current, -1))}
              className="rounded-md px-2 py-1 text-lg text-muted hover:bg-background hover:text-foreground"
            >
              ‹
            </button>
            <p className="text-sm font-semibold capitalize text-foreground">{monthLabel}</p>
            <button
              type="button"
              aria-label={t('datePicker.nextMonth')}
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
              className="rounded-md px-2 py-1 text-lg text-muted hover:bg-background hover:text-foreground"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildCalendarDays(viewMonth).map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} aria-hidden />
              }

              const isSelected = isSameDay(day, value)
              const isToday = isSameDay(day, today)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(day)
                    setOpen(false)
                  }}
                  className={[
                    'rounded-md py-1.5 text-sm transition-colors',
                    isSelected
                      ? 'bg-primary font-semibold text-white hover:bg-primary-hover'
                      : 'text-foreground hover:bg-background',
                    isToday && !isSelected ? 'ring-1 ring-primary/40' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
