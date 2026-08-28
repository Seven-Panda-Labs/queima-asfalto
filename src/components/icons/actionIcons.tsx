const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-4 w-4',
  'aria-hidden': true,
} as const

/**
 * Ações de linha e de cartão. Vivem todas aqui para que a mesma ação tenha o
 * mesmo desenho em Eventos, Objetivos e Bucket List.
 */
export function PencilIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 7h16" />
      <path d="M10 4h4" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function EyeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function ChartIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

/** Registar o resultado de uma prova já corrida. */
export function StopwatchActionIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 3v4" />
      <path d="M9 3h6" />
      <path d="M12 14l3-3" />
    </svg>
  )
}

/** Devolver um evento à bucket list. */
export function BucketIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 7h16l-1.5 13h-13L4 7Z" />
      <path d="M9 4h6" />
      <path d="M4 7h16" />
    </svg>
  )
}

/** Marcar um sonho da bucket list como evento no calendário. */
export function CalendarPlusIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 13v5M9.5 15.5h5" />
    </svg>
  )
}

/** Abrir o site da prova, noutro separador. */
export function ExternalLinkIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  )
}
