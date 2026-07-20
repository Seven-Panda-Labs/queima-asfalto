import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type SharedOwnerTab = {
  ownerId: string | null
  label: string
}

type SharedOwnerTabsProps = {
  tabs: SharedOwnerTab[]
  activeOwnerId: string | null
  onChange: (ownerId: string | null) => void
  ariaLabelKey: string
}

export function SharedOwnerTabs({ tabs, activeOwnerId, onChange, ariaLabelKey }: SharedOwnerTabsProps) {
  const { t } = useTranslation()

  if (tabs.length <= 1) return null

  return (
    <div
      className="inline-flex w-full rounded-lg border border-border bg-background p-1 sm:w-auto"
      role="tablist"
      aria-label={t(ariaLabelKey)}
    >
      {tabs.map((tab) => {
        const active = tab.ownerId === activeOwnerId
        return (
          <button
            key={tab.ownerId ?? 'mine'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.ownerId)}
            className={[
              'flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5',
              active ? 'bg-primary text-white' : 'text-muted hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function SharedContextBanner({
  message,
  children,
}: {
  message: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
      {message}
      {children}
    </div>
  )
}
