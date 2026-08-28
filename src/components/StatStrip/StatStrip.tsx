import type { ReactNode } from 'react'

export type StatStripItem = {
  icon: ReactNode
  value: string
  label: string
}

/**
 * Faixa única com divisórias em vez de cartões soltos: os números do ano
 * lêem-se como um bloco só e deixam de se confundir com o fundo da página.
 */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 bg-surface px-4 py-4">
          <span className="text-accent">{item.icon}</span>
          <div className="min-w-0">
            <p className="font-display text-3xl leading-none tracking-wide text-foreground">
              {item.value}
            </p>
            <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wider text-muted">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
