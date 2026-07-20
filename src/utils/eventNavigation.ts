import type { EventMedia } from '../types/EventMedia'
import type { EventStatus, EventType } from '../types/Event'
import { EVENT_STATUSES, EVENT_TYPES } from '../types/Event'
import type { EventsViewMode } from './eventsViewMode'

export type EventDetailState = {
  returnTo?: string
  uploadedMedia?: EventMedia[]
}

export type EventsListFilters = {
  status: EventStatus | 'all'
  year: number | 'all'
  view: EventsViewMode
}

export type ResultsListFilters = {
  year: number | 'all'
  type: EventType | 'all'
}

const EVENTS_VIEW_MODES: EventsListFilters['view'][] = ['lista', 'calendario', 'mapa']

export function isSafeReturnPath(path: string): boolean {
  try {
    const { pathname } = new URL(path, 'http://local')
    return pathname === '/eventos' || pathname === '/resultados'
  } catch {
    return false
  }
}

export function getReturnTo(state: unknown): string {
  const returnTo = (state as EventDetailState | null)?.returnTo
  return returnTo && isSafeReturnPath(returnTo) ? returnTo : '/eventos'
}

export function eventLinkState(returnTo: string): { state: EventDetailState } {
  return { state: { returnTo } }
}

export function parseOwnerSearchParam(searchParams: URLSearchParams): string | null {
  const owner = searchParams.get('owner')?.trim()
  return owner || null
}

export type EventDetailLinkOptions = {
  ownerId?: string | null
  returnTo?: string | null
}

export function buildEventDetailPath(eventId: string, options?: EventDetailLinkOptions): string {
  const params = new URLSearchParams()
  if (options?.ownerId) params.set('owner', options.ownerId)
  if (options?.returnTo && isSafeReturnPath(options.returnTo)) {
    params.set('returnTo', options.returnTo)
  }
  const query = params.toString()
  return query ? `/eventos/${eventId}?${query}` : `/eventos/${eventId}`
}

export function getEventDetailReturnTo(state: unknown, searchParams: URLSearchParams): string {
  const fromState = (state as EventDetailState | null)?.returnTo
  if (fromState && isSafeReturnPath(fromState)) return fromState

  const fromQuery = searchParams.get('returnTo')
  if (fromQuery && isSafeReturnPath(fromQuery)) return fromQuery

  const ownerId = parseOwnerSearchParam(searchParams)
  if (ownerId) return `/eventos?owner=${encodeURIComponent(ownerId)}`

  return '/eventos'
}

function parseYearParam(value: string | null, currentYear: number): number | 'all' {
  if (value === 'all') return 'all'
  if (!value) return currentYear
  const year = Number(value)
  return Number.isInteger(year) && year > 1900 ? year : currentYear
}

export function parseEventsListSearchParams(
  searchParams: URLSearchParams,
  currentYear: number,
  defaultView: EventsViewMode,
): EventsListFilters {
  const statusParam = searchParams.get('status')
  const status =
    statusParam === 'all' || EVENT_STATUSES.includes(statusParam as EventStatus)
      ? (statusParam as EventsListFilters['status'])
      : 'all'

  const viewParam = searchParams.get('view')
  const view = EVENTS_VIEW_MODES.includes(viewParam as EventsViewMode)
    ? (viewParam as EventsViewMode)
    : defaultView

  return {
    status,
    year: parseYearParam(searchParams.get('year'), currentYear),
    view,
  }
}

export function buildEventsListSearchParams(filters: EventsListFilters, currentYear: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.year !== 'all' && filters.year !== currentYear) params.set('year', String(filters.year))
  if (filters.year === 'all') params.set('year', 'all')
  if (filters.view !== 'lista') params.set('view', filters.view)
  return params
}

export function buildEventsListPath(
  filters: EventsListFilters,
  currentYear: number,
  ownerId?: string | null,
): string {
  const qs = buildEventsListSearchParams(filters, currentYear)
  if (ownerId) qs.set('owner', ownerId)
  const query = qs.toString()
  return query ? `/eventos?${query}` : '/eventos'
}

export function parseResultsListSearchParams(
  searchParams: URLSearchParams,
  currentYear: number,
): ResultsListFilters {
  const typeParam = searchParams.get('type')
  const type =
    typeParam === 'all' || EVENT_TYPES.includes(typeParam as EventType)
      ? (typeParam as ResultsListFilters['type'])
      : 'all'

  return {
    year: parseYearParam(searchParams.get('year'), currentYear),
    type,
  }
}

export function buildResultsListSearchParams(filters: ResultsListFilters, currentYear: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.year !== 'all' && filters.year !== currentYear) params.set('year', String(filters.year))
  if (filters.year === 'all') params.set('year', 'all')
  if (filters.type !== 'all') params.set('type', filters.type)
  return params
}

export function buildResultsListPath(
  filters: ResultsListFilters,
  currentYear: number,
  ownerId?: string | null,
): string {
  const qs = buildResultsListSearchParams(filters, currentYear)
  if (ownerId) qs.set('owner', ownerId)
  const query = qs.toString()
  return query ? `/resultados?${query}` : '/resultados'
}
