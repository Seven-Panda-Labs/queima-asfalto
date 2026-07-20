import { splitFullName } from './matchName.js'
import type { UserResultsProfile } from './types.js'

export const RACERESULT_API_BASE = 'https://my2.raceresult.com'
export const RACERESULT_REFERER = 'https://my.raceresult.com/'

export type RaceResultListConfig = {
  Name: string
  Contest: string
  ID: string
}

export type RaceResultConfig = {
  key: string
  TabConfig?: {
    Lists?: RaceResultListConfig[]
  }
}

export type RaceResultListResponse = {
  DataFields?: string[]
  data?: unknown[] | Record<string, unknown[]>
  error?: string
}

const NAME_FIELDS = ['FLNAME', 'AnzeigeName', 'NAME', 'Name']
const NAME_FIELD_PATTERN = /AnzeigeTitel|FLNAME|AnzeigeName/i
const TIME_FIELDS = ['TIME', 'Ziel.CHIP', 'Ziel', 'Nettozeit', 'Netto', 'Brutto']
const TIME_FIELD_PATTERN = /ZeitMitStatus|ZeitmitStatus|^TIME$|Nettozeit|Ziel\.CHIP|^Ziel$/i
const RANK_FIELD_PATTERN = /AUTORANK|GesPlp|Gesamt/i
const CATEGORY_RANK_FIELD_PATTERN = /MWPlp|AKPlp|MWPl|AKPl|Geschlecht|AGEGROUP/i
const RACE_RESULT_EMBED_HASH_PATTERN = /^(\d+)_([A-F0-9]+)$/i
const RRPUBLISH_EVENT_ID_PATTERN = /new\s+RRPublish\s*\([^,]+,\s*(\d+)\s*,/i

export function buildRaceResultConfigUrl(eventId: string): string {
  return `${RACERESULT_API_BASE}/${eventId}/results/config`
}

export function buildRaceResultSearchUrl(params: {
  eventId: string
  key: string
  listName: string
  contest: string
  term: string
}): string {
  const search = new URLSearchParams({
    key: params.key,
    listname: params.listName,
    page: 'results',
    contest: params.contest,
    r: 'search',
    term: params.term,
    l: '0',
    fav: '',
    openedGroups: '{}',
    f: '\f<Ignore>\f<Ignore>',
  })
  return `${RACERESULT_API_BASE}/${params.eventId}/results/list?${search.toString()}`
}

export function buildRaceResultListUrl(params: {
  eventId: string
  key: string
  listName: string
  contest: string
}): string {
  const search = new URLSearchParams({
    key: params.key,
    listname: params.listName,
    page: 'results',
    contest: params.contest,
    r: 'group',
  })
  return `${RACERESULT_API_BASE}/${params.eventId}/results/list?${search.toString()}`
}

export function resolveRaceResultList(
  config: RaceResultConfig,
  listId?: string,
  contest?: string,
): RaceResultListConfig | null {
  const lists = config.TabConfig?.Lists ?? []
  if (listId) {
    const byId = lists.find((list) => list.ID === listId)
    if (byId) return byId
  }
  if (contest != null) {
    const byContest = lists.find((list) => String(list.Contest) === String(contest))
    if (byContest) return byContest
  }
  return lists[0] ?? null
}

export function listsToSearch(
  config: RaceResultConfig,
  listId?: string,
  contest?: string,
): RaceResultListConfig[] {
  const lists = config.TabConfig?.Lists ?? []
  if (lists.length === 0) return []

  const primary = resolveRaceResultList(config, listId, contest)
  if (!primary) return lists

  const others = lists.filter((list) => list.ID !== primary.ID)
  return [primary, ...others]
}

export function isUsableRaceResultList(response: RaceResultListResponse): boolean {
  if (response.error) return false
  return Array.isArray(response.DataFields) && response.DataFields.length > 0
}

export function findFieldIndex(dataFields: string[], candidates: string[]): number | undefined {
  for (const candidate of candidates) {
    const index = dataFields.indexOf(candidate)
    if (index >= 0) return index
  }
  return undefined
}

function findFieldIndexByPattern(dataFields: string[], pattern: RegExp): number | undefined {
  const index = dataFields.findIndex((field) => pattern.test(field))
  return index >= 0 ? index : undefined
}

export function findRankFieldIndex(dataFields: string[]): number | undefined {
  const byPattern = findFieldIndexByPattern(dataFields, RANK_FIELD_PATTERN)
  if (byPattern != null) return byPattern
  return findFieldIndex(dataFields, ['RANK', 'Rank', 'Platz', 'Pos', 'GesPlp'])
}

function findNameFieldIndex(dataFields: string[]): number | undefined {
  return findFieldIndex(dataFields, NAME_FIELDS) ?? findFieldIndexByPattern(dataFields, NAME_FIELD_PATTERN)
}

function findTimeFieldIndex(dataFields: string[]): number | undefined {
  return findFieldIndex(dataFields, TIME_FIELDS) ?? findFieldIndexByPattern(dataFields, TIME_FIELD_PATTERN)
}

export function raceResultFieldIndexes(dataFields: string[]): {
  name: number
  time: number
  rank?: number
} | null {
  const name = findNameFieldIndex(dataFields)
  const time = findTimeFieldIndex(dataFields)
  const rank = findRankFieldIndex(dataFields)
  if (name == null || time == null) return null
  return { name, time, rank }
}

export function parseRaceResultName(displayName: string): { first: string; last: string } {
  const trimmed = displayName.trim()
  const commaMatch = /^([^,]+),\s*(.+)$/.exec(trimmed)
  if (commaMatch) {
    return { first: commaMatch[2]!.trim(), last: commaMatch[1]!.trim() }
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (
    parts.length >= 2 &&
    parts[0] === parts[0]!.toUpperCase() &&
    /[a-z]/.test(parts[parts.length - 1]!)
  ) {
    return { first: parts.slice(1).join(' '), last: parts[0]! }
  }

  return splitFullName(trimmed)
}

function normalizeRaceResultText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function namesMatchRaceResultDisplay(
  profile: UserResultsProfile,
  displayName: string,
): boolean {
  const { first, last } = parseRaceResultName(displayName)
  const profileFirst = normalizeRaceResultText(profile.resultFirstName ?? '')
  const profileLast = normalizeRaceResultText(profile.resultLastName ?? '')
  const candidateFirst = normalizeRaceResultText(first)
  const candidateLast = normalizeRaceResultText(last)

  if (!profileFirst && !profileLast) return false

  const lastMatches =
    !profileLast || candidateLast.includes(profileLast) || profileLast.includes(candidateLast)
  const firstMatches =
    !profileFirst || candidateFirst.includes(profileFirst) || profileFirst.includes(candidateFirst)
  if (lastMatches && firstMatches) return true

  const normalizedDisplay = normalizeRaceResultText(displayName.replace(/,/g, ' '))
  const profileParts = [profileFirst, profileLast].filter(Boolean)
  return profileParts.every((part) => normalizedDisplay.includes(part))
}

export function parseRaceResultEmbedHash(url: string): { contest: string; listId: string } | null {
  try {
    const hash = new URL(url.trim()).hash.replace(/^#/, '')
    const match = RACE_RESULT_EMBED_HASH_PATTERN.exec(hash)
    if (!match?.[1] || !match[2]) return null
    return { contest: match[1], listId: match[2] }
  } catch {
    return null
  }
}

export function extractRaceResultEventIdFromHtml(html: string): string | undefined {
  const match = RRPUBLISH_EVENT_ID_PATTERN.exec(html)
  return match?.[1]
}

export function isRaceResultCategoryRankField(field: string): boolean {
  return CATEGORY_RANK_FIELD_PATTERN.test(field)
}

export function shouldComputeRaceResultOverallRank(
  dataFields: string[],
  rankIndex?: number,
): boolean {
  if (rankIndex == null) return true
  const field = dataFields[rankIndex] ?? ''
  if (RANK_FIELD_PATTERN.test(field)) return false
  return isRaceResultCategoryRankField(field)
}

export function raceTimeToSeconds(time: string): number | null {
  const trimmed = time.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3])
  }

  const ms = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (ms) {
    return Number(ms[1]) * 60 + Number(ms[2])
  }

  return null
}

export function computeRaceResultOverallPosition(
  rows: string[][],
  indexes: { name: number; time: number },
  profile: UserResultsProfile,
  matchedTime: string,
): { position: number; totalParticipants: number } | null {
  const matchedSeconds = raceTimeToSeconds(matchedTime)
  if (matchedSeconds == null) return null

  const finishers = rows
    .map((row) => ({
      row,
      seconds: raceTimeToSeconds(row[indexes.time] ?? ''),
    }))
    .filter((entry): entry is { row: string[]; seconds: number } => entry.seconds != null)
    .sort((left, right) => left.seconds - right.seconds)

  if (finishers.length === 0) return null

  const matchIndex = finishers.findIndex((entry) => {
    const displayName = entry.row[indexes.name] ?? ''
    return (
      namesMatchRaceResultDisplay(profile, displayName) ||
      entry.seconds === matchedSeconds
    )
  })

  if (matchIndex < 0) return null

  return {
    position: matchIndex + 1,
    totalParticipants: finishers.length,
  }
}

export function flattenRaceResultData(data: unknown): unknown[] {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const rows: unknown[] = []
    for (const groupRows of Object.values(data as Record<string, unknown>)) {
      rows.push(...flattenRaceResultData(groupRows))
    }
    return rows
  }
  return []
}

export function raceResultDataRows(data: unknown): string[][] {
  return flattenRaceResultData(data).filter(
    (row): row is string[] => Array.isArray(row) && row.length > 1 && typeof row[0] === 'string',
  )
}

export function totalParticipantsFromRaceResultData(data: unknown): number | undefined {
  const flat = flattenRaceResultData(data)
  const last = flat[flat.length - 1]
  if (!Array.isArray(last) || last.length !== 1) return undefined
  const total = Number(last[0])
  return Number.isFinite(total) ? total : undefined
}

export function totalParticipantsForRaceResultRow(data: unknown, row: string[]): number | undefined {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const groupRows of Object.values(data as Record<string, unknown>)) {
      if (!Array.isArray(groupRows) || !groupRows.includes(row)) continue
      return totalParticipantsFromRaceResultData(groupRows)
    }
  }
  return totalParticipantsFromRaceResultData(data)
}
