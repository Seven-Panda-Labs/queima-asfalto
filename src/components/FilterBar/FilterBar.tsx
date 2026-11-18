import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Todos os filtros de uma página numa fila só. Antes, cada grupo era um bloco
 * com o rótulo por cima, e três grupos empilhados enchiam o ecrã de controlos
 * antes de se ver um único resultado.
 */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
    </div>
  )
}

function pillClass(active: boolean): string {
  return [
    'rounded-full px-3 py-1 text-sm font-semibold transition-colors',
    active
      ? 'bg-primary text-white'
      : 'text-muted ring-1 ring-border hover:text-foreground',
  ].join(' ')
}

export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={pillClass(active)}
    >
      {children}
    </button>
  )
}

/**
 * A pill per season from the latest past one on, newest first. Older seasons go
 * in a list, so the row stops growing with the runner's history.
 */
export function FilterYears({
  years,
  currentYear,
  value,
  onChange,
}: {
  /** Newest first. */
  years: number[]
  currentYear: number
  value: number | 'all'
  onChange: (year: number) => void
}) {
  const { t } = useTranslation()
  const latestPast = years.find((year) => year < currentYear) ?? currentYear
  const older = years.filter((year) => year < latestPast)
  const olderActive = typeof value === 'number' && older.includes(value)

  return (
    <>
      {years
        .filter((year) => year >= latestPast)
        .map((year) => (
          <FilterPill key={year} active={value === year} onClick={() => onChange(year)}>
            {year}
          </FilterPill>
        ))}
      {older.length > 0 ? (
        <select
          aria-label={t('common.earlierYears')}
          value={olderActive ? value : ''}
          onChange={(event) => onChange(Number(event.target.value))}
          className={pillClass(olderActive)}
        >
          <option value="" disabled className="bg-surface text-foreground">
            {t('common.earlierYears')}
          </option>
          {older.map((year) => (
            <option key={year} value={year} className="bg-surface text-foreground">
              {year}
            </option>
          ))}
        </select>
      ) : null}
    </>
  )
}
