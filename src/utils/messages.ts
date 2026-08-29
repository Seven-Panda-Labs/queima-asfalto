import i18n from '../i18n'

function firstName(displayName?: string | null): string | undefined {
  if (!displayName) return undefined
  const name = displayName.trim().split(/\s+/)[0]
  return name || undefined
}

/** Aviso quando um evento transita sozinho para «Faltou». */
export function getFaltouMessage(eventName: string, displayName?: string | null): string {
  const name = firstName(displayName) ?? ''
  return i18n.t('messages.faltouAuto', { name, event: eventName })
}
