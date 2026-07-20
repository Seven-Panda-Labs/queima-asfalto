import i18n from '../i18n'
import { parseClassification } from './classification'

function firstName(displayName?: string | null): string | undefined {
  if (!displayName) return undefined
  const name = displayName.trim().split(/\s+/)[0]
  return name || undefined
}

export function getResultsSavedMessage(
  displayName?: string | null,
  pace?: string | null,
  classification?: string,
): string {
  if (classification) {
    const parsed = parseClassification(classification.split('\n')[0]?.replace(/^\d+\.\s*/, '') ?? '')
    if (parsed) {
      const sarcastic = getSarcasticClassification(parsed.position, parsed.total)
      if (sarcastic) return sarcastic
    }
  }

  const name = firstName(displayName)
  const prefix = name ? `E então, ${name}? ` : ''
  const pacePart = pace ? ` Ritmo: ${pace} min/Km.` : ''
  return `${prefix}Hoje foi dia de suar a camisola!${pacePart} VAMOS!`
}

export function getFaltouMessage(eventName: string, displayName?: string | null): string {
  const name = firstName(displayName) ?? ''
  return i18n.t('messages.faltouAuto', { name, event: eventName })
}

export function getSarcasticClassification(position: number, total: number): string | null {
  if (position <= 0 || total <= 0 || position > total) return null

  const percentile = position / total
  if (percentile <= 0.5) return null

  if (position % 20 !== 0) {
    return `Classificação ${position}/${total} — continua a treinar! VAMOS!`
  }

  return `${position}º lugar? Bem, pelo menos não foste o último... desta vez.`
}

export function getPaceComment(_pace: string, _eventType: string): string | null {
  return null
}
