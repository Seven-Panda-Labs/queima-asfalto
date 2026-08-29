import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { detectPlatform } from '../../../shared/officialResults'
import type { Event } from '../../types/Event'
import { updateEvent } from '../../services/events'

type EventResultsUrlFieldProps = {
  event: Event
  onSaved: () => void
}

/**
 * Colar o link dos resultados oficiais sem passar pelo formulário do evento.
 * É o que destranca a procura automática, por isso pertence ao sítio onde se
 * repara que ainda não há resultado.
 */
export function EventResultsUrlField({ event, onSaved }: EventResultsUrlFieldProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const trimmed = url.trim()
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError(t('validation.invalidLink'))
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateEvent(event.id, {
        resultsUrl: trimmed,
        resultsPlatform: detectPlatform(trimmed, event.name) ?? undefined,
      })
      setUrl('')
      onSaved()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('errors.unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    // Sem <form>: isto vive dentro do formulário do resultado, e formulários
    // não podem aninhar-se.
    <div className="w-full">
      <label htmlFor="results-url" className="block text-xs font-semibold uppercase tracking-wider text-muted">
        {t('eventDetail.pasteResultsUrl')}
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="results-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(changeEvent) => {
            setUrl(changeEvent.target.value)
            setError(null)
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              keyEvent.preventDefault()
              void handleSave()
            }
          }}
          placeholder="https://"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || url.trim() === ''}
          className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('common.add')}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  )
}
