export type ViewOption<T extends string> = {
  value: T
  label: string
  /** Contador opcional, como os convites por responder nas Definições. */
  badge?: number
  badgeLabel?: string
}

type ViewSwitcherProps<T extends string> = {
  options: ViewOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /**
   * `tablist` quando os botões trocam painéis de conteúdo, `group` quando
   * mudam a representação da mesma lista. O desenho é o mesmo; muda o que os
   * leitores de ecrã anunciam.
   */
  as?: 'group' | 'tablist'
}

/*
 * The radius is half a single row (42px box), not `rounded-full`: on a narrow
 * screen the options wrap to two or three rows, and `rounded-full` drew a
 * giant oval around the whole block.
 */
export const segmentedGroupClass =
  'inline-flex flex-wrap gap-y-1 rounded-[1.3125rem] border border-border bg-surface p-1'

/** Shared with route-based tabs (Admin), which need links instead of buttons. */
export function segmentedItemClass(active: boolean): string {
  return [
    'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
    active ? 'bg-primary text-white' : 'text-muted hover:text-foreground',
  ].join(' ')
}

/**
 * Muda a representação dos mesmos dados, ao contrário dos filtros, que mudam
 * que dados são. São operações diferentes, por isso não se parecem: este é um
 * controlo segmentado sólido, os filtros são pastilhas soltas.
 */
export function ViewSwitcher<T extends string>({
  options,
  value,
  onChange,
  label,
  as = 'group',
}: ViewSwitcherProps<T>) {
  const isTablist = as === 'tablist'

  return (
    <div
      role={isTablist ? 'tablist' : 'group'}
      aria-label={label}
      className={segmentedGroupClass}
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role={isTablist ? 'tab' : undefined}
            aria-selected={isTablist ? active : undefined}
            aria-pressed={isTablist ? undefined : active}
            onClick={() => onChange(option.value)}
            className={segmentedItemClass(active)}
          >
            {option.label}
            {option.badge && option.badge > 0 ? (
              <span
                aria-label={option.badgeLabel}
                className={[
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
                  active ? 'bg-white text-primary' : 'bg-accent text-white',
                ].join(' ')}
              >
                {option.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
