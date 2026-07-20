import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  greeting?: string
  description?: string
  children?: ReactNode
}

export function PageShell({ title, greeting, description, children }: PageShellProps) {
  return (
    <div>
      {greeting ? (
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{greeting}</p>
      ) : null}
      <h1 className="mt-1 font-display text-4xl tracking-wide text-primary">{title}</h1>
      {description ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-muted">{description}</p>
        </div>
      ) : null}
      {children}
    </div>
  )
}
