import { useTranslation } from 'react-i18next'
import { EMOJI_OPTIONS } from '../../constants/emojis'
import { formatEmojiLabel } from '../../i18n/formatters'

type EmojiPickerProps = {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const { i18n } = useTranslation()

  return (
    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-border p-2">
      {EMOJI_OPTIONS.map(({ emoji, labelKey }) => {
        const label = formatEmojiLabel(labelKey)
        return (
          <button
            key={`${labelKey}-${emoji}-${i18n.language}`}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onChange(emoji)}
            className={[
              'rounded-md px-3 py-2 text-lg ring-1',
              value === emoji ? 'ring-primary bg-background' : 'ring-border bg-surface',
            ].join(' ')}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}
