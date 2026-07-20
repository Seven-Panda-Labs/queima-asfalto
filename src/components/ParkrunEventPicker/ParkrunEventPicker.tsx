import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParkrunCatalog, ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import { formatParkrunEventSubtitle } from '../../../shared/parkrun/countries'
import {
  findParkrunEvent,
  findParkrunEventsBySlugs,
  loadParkrunCatalog,
  searchParkrunCatalog,
} from '../../services/parkrunCatalog'

type ParkrunEventPickerProps = {
  id?: string
  value: string | null
  favoriteSlugs?: string[]
  onChange: (event: ParkrunCatalogEvent) => void
  onClearSelection?: () => void
  hasError?: boolean
}

export function ParkrunEventPicker({
  id,
  value,
  favoriteSlugs = [],
  onChange,
  onClearSelection,
  hasError = false,
}: ParkrunEventPickerProps) {
  const { t, i18n } = useTranslation()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const userIsTypingRef = useRef(false)
  const [catalog, setCatalog] = useState<ParkrunCatalog | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    let cancelled = false
    void loadParkrunCatalog().then((loaded) => {
      if (!cancelled) setCatalog(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedEvent = catalog && value ? findParkrunEvent(catalog, value) : undefined
  const favorites = useMemo(
    () => (catalog ? findParkrunEventsBySlugs(catalog, favoriteSlugs) : []),
    [catalog, favoriteSlugs],
  )

  const searchResults = useMemo(() => {
    if (!catalog || !query.trim()) return []
    return searchParkrunCatalog(catalog, query, { limit: 12 })
  }, [catalog, query])

  const showFavorites = !query.trim() && favorites.length > 0
  const visibleEvents = showFavorites ? favorites : searchResults

  useEffect(() => {
    if (!catalog) return

    if (!value) {
      if (!userIsTypingRef.current) {
        setQuery('')
      }
      return
    }

    if (userIsTypingRef.current) return

    const event = findParkrunEvent(catalog, value)
    if (event) {
      setQuery(event.longName)
    }
  }, [value, catalog])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectEvent(event: ParkrunCatalogEvent) {
    userIsTypingRef.current = false
    setQuery(event.longName)
    onChange(event)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleQueryChange(nextQuery: string) {
    userIsTypingRef.current = true
    setQuery(nextQuery)
    setOpen(true)
    setActiveIndex(-1)

    if (value != null) {
      onClearSelection?.()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        disabled={!catalog}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => {
          if (showFavorites || searchResults.length > 0) setOpen(true)
        }}
        onKeyDown={(event) => {
          if (!open || visibleEvents.length === 0) return

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) => (current + 1) % visibleEvents.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) =>
              current <= 0 ? visibleEvents.length - 1 : current - 1,
            )
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            selectEvent(visibleEvents[activeIndex]!)
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder={catalog ? t('parkrun.pickerPlaceholder') : t('common.loading')}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={[
          'w-full rounded-md border bg-surface px-3 py-2',
          hasError ? 'border-danger' : 'border-border',
        ].join(' ')}
      />

      {selectedEvent ? (
        <p className="mt-1 text-xs text-muted">
          {formatParkrunEventSubtitle(
            selectedEvent.location,
            selectedEvent.countryCode,
            i18n.language,
          )}
        </p>
      ) : null}

      {open && visibleEvents.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {showFavorites ? (
            <li className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {t('parkrun.favoritesHeading')}
            </li>
          ) : null}
          {visibleEvents.map((event, index) => (
            <li key={event.slug} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
                onClick={() => selectEvent(event)}
                className={[
                  'block w-full px-3 py-2 text-left hover:bg-background',
                  index === activeIndex ? 'bg-background' : '',
                ].join(' ')}
              >
                <span className="block text-sm font-medium text-foreground">{event.longName}</span>
                <span className="block text-xs text-muted">
                  {formatParkrunEventSubtitle(event.location, event.countryCode, i18n.language)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && query.trim().length > 0 && searchResults.length === 0 && catalog ? (
        <p className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted shadow-lg">
          {t('parkrun.noResults')}
        </p>
      ) : null}
    </div>
  )
}
