type IconProps = {
  className?: string
}

const SHARED_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

/** Decorativos: o rótulo ao lado é que nomeia a estatística. */
export function RoadIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <path d="M4 21L8 3h8l4 18" />
      <path d="M12 5v3" />
      <path d="M12 11v3" />
      <path d="M12 17v3" />
    </svg>
  )
}

export function FinishFlagIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <path d="M4 22V3" />
      <path d="M4 4h14l-2 4 2 4H4" />
      <path d="M11 4v8" />
      <path d="M4 8h12" />
    </svg>
  )
}

export function StopwatchIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...SHARED_PROPS} className={className}>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 3v4" />
      <path d="M9 3h6" />
      <path d="M12 14l3-3" />
    </svg>
  )
}
