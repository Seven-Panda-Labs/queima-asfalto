import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchLocations, type GeocodingSuggestion } from '../../services/geocoding'

type LocationAutocompleteProps = {
  id?: string
  value: string
  onChange: (location: string, coords?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function LocationAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  className = '',
  hasError = false,
}: LocationAutocompleteProps) {
  const { t, i18n } = useTranslation()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const skipNextSearchRef = useRef(false)
  const userIsTypingRef = useRef(false)
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }

    if (!userIsTypingRef.current) return

    if (value.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void searchLocations(value, i18n.language)
        .then((results) => {
          if (cancelled) return
          setSuggestions(results)
          setOpen(results.length > 0)
          setActiveIndex(-1)
        })
        .catch(() => {
          if (cancelled) return
          setSuggestions([])
          setOpen(false)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value, i18n.language])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectSuggestion(suggestion: GeocodingSuggestion) {
    skipNextSearchRef.current = true
    onChange(suggestion.label, { lat: suggestion.lat, lng: suggestion.lng })
    setOpen(false)
    setSuggestions([])
    setLoading(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          userIsTypingRef.current = true
          onChange(event.target.value)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) => (current + 1) % suggestions.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            selectSuggestion(suggestions[activeIndex])
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={[
          'w-full rounded-md border bg-surface px-3 py-2',
          hasError ? 'border-danger' : 'border-border',
          className,
        ].join(' ')}
      />

      {loading ? (
        <p className="mt-1 text-xs text-muted">{t('locationAutocomplete.searching')}</p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.lat}-${suggestion.lng}-${suggestion.label}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                className={[
                  'block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background',
                  index === activeIndex ? 'bg-background' : '',
                ].join(' ')}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
