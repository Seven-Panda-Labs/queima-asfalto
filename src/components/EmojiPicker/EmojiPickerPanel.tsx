import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { EmojiClickEvent, I18n } from 'emoji-picker-element/shared'
import 'emoji-picker-element'
import { useTheme } from '../../contexts/ThemeContext'
import type { AppLanguage } from '../../i18n/languages'

type EmojiPickerPanelProps = {
  onSelect: (emoji: string) => void
}

const UI_TEXT_LOADERS: Partial<Record<AppLanguage, () => Promise<{ default: I18n }>>> = {
  pt: () => import('emoji-picker-element/i18n/pt_PT.js'),
  es: () => import('emoji-picker-element/i18n/es.js'),
  de: () => import('emoji-picker-element/i18n/de.js'),
  fr: () => import('emoji-picker-element/i18n/fr.js'),
  ar: () => import('emoji-picker-element/i18n/ar.js'),
}

function resolveAppLanguage(language: string): AppLanguage {
  return language === 'pt' || language === 'es' || language === 'de' || language === 'fr' || language === 'ar'
    ? language : 'en'
}

/** emoji-picker-element-data ships no Arabic search index yet; keep the English one. */
function resolveDataLocale(language: AppLanguage): string {
  return language === 'ar' ? 'en' : language
}

export default function EmojiPickerPanel({ onSelect }: EmojiPickerPanelProps) {
  const { i18n } = useTranslation()
  const { effectiveTheme } = useTheme()
  const ref = useRef<HTMLElementTagNameMap['emoji-picker']>(null)
  const language = resolveAppLanguage(i18n.language)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const loadUiText = UI_TEXT_LOADERS[language]
    if (!loadUiText) return

    let cancelled = false
    loadUiText().then((mod) => {
      if (!cancelled) element.i18n = mod.default
    })

    return () => {
      cancelled = true
    }
  }, [language])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    function handleEmojiClick(event: EmojiClickEvent) {
      if (event.detail.unicode) onSelect(event.detail.unicode)
    }

    element.addEventListener('emoji-click', handleEmojiClick)
    return () => element.removeEventListener('emoji-click', handleEmojiClick)
  }, [onSelect])

  return (
    <emoji-picker
      ref={ref}
      className={effectiveTheme}
      locale={resolveDataLocale(language)}
      data-source={`/emoji-data/${resolveDataLocale(language)}.json`}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
