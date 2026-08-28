import type { ReactNode } from 'react'

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
      className={[
        'rounded-full px-3 py-1 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-muted ring-1 ring-border hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
