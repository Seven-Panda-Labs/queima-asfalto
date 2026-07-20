import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { pickSharedVoiceLines, type SharedVoiceSection } from '../../i18n/voiceLoading'

type SharedDataLoadingProps = {
  section: SharedVoiceSection
  ownerName: string
  variant?: 'default' | 'compact'
}

export function SharedDataLoading({
  section,
  ownerName,
  variant = 'default',
}: SharedDataLoadingProps) {
  const { t } = useTranslation()
  const seedRef = useRef(Math.floor(Math.random() * 10_000))
  const lines = useMemo(
    () => pickSharedVoiceLines(t, section, ownerName, seedRef.current),
    [t, section, ownerName],
  )

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={lines.aria}
      className={[
        'flex flex-col items-center justify-center text-center',
        variant === 'compact' ? 'py-10' : 'py-16',
      ].join(' ')}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"
        aria-hidden
      />
      <p className="mt-6 max-w-md text-lg font-semibold text-foreground">{lines.primary}</p>
      {lines.secondary ? (
        <p className="mt-2 max-w-md text-sm text-muted">{lines.secondary}</p>
      ) : null}
    </div>
  )
}
