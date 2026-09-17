import {
  isMaxFunSportsPdfText,
  isParkrunPdfText,
  maxFunSportsPdfCandidates,
  maxFunSportsPdfEventDate,
  parkrunPdfCandidates,
  parkrunPdfEventDateCandidates,
  parseMaxFunSportsPdfText,
  parseParkrunPdfHeader,
  type OfficialResultCandidate,
  type ResultsPlatform,
  type UserResultsProfile,
} from '../../shared/officialResults'
import { MAX_RESULTS_PDF_BYTES, MAX_RESULTS_PDF_CANDIDATES } from '../constants/resultsPdf'
import { extractPdfText } from './resultsPdfText'

export type ResultsPdfErrorCode =
  | 'unsupported_type'
  | 'file_too_large'
  | 'unreadable'
  | 'not_a_results_pdf'
  | 'wrong_event'
  | 'name_not_found'

export type ResultsPdfImport = {
  candidates: OfficialResultCandidate[]
  /** More matched than are shown, so the reader knows the list is cut. */
  truncated: boolean
  eventName?: string
  preliminary: boolean
}

export type ResultsPdfResult =
  | { ok: true; result: ResultsPdfImport }
  | { ok: false; code: ResultsPdfErrorCode; pdfEventName?: string }

export type ResultsPdfEvent = {
  date: Date
  platform: ResultsPlatform
  resultsUrl?: string
}

/**
 * A day either side, the same tolerance the connectors use: an event is stored
 * at local midnight and the document prints the organiser's own calendar day.
 */
const DATE_TOLERANCE_DAYS = 1

/**
 * How to read one operator's results document.
 *
 * `eventDates` returns every reading of the printed day, not one: parkrun
 * formats it in whatever locale the browser was in, so `8/9/26` is two days
 * until the event says which.
 */
type ResultsPdfReader = {
  matches: (text: string) => boolean
  eventDates: (text: string) => Date[]
  eventName: (text: string) => string | undefined
  preliminary: (text: string) => boolean
  candidates: (
    text: string,
    profile: UserResultsProfile,
    sourceUrl: string,
  ) => OfficialResultCandidate[]
}

const READERS: Partial<Record<ResultsPlatform, ResultsPdfReader>> = {
  maxfunsports: {
    matches: isMaxFunSportsPdfText,
    eventDates: (text) => {
      const date = maxFunSportsPdfEventDate(parseMaxFunSportsPdfText(text).header)
      return date ? [date] : []
    },
    eventName: (text) => parseMaxFunSportsPdfText(text).header.eventName,
    preliminary: (text) => parseMaxFunSportsPdfText(text).header.preliminary,
    candidates: (text, profile, sourceUrl) =>
      maxFunSportsPdfCandidates(parseMaxFunSportsPdfText(text), profile, sourceUrl),
  },
  parkrun: {
    matches: isParkrunPdfText,
    eventDates: (text) => parkrunPdfEventDateCandidates(parseParkrunPdfHeader(text)),
    eventName: (text) => parseParkrunPdfHeader(text).eventName,
    // The page is the live results, which parkrun does not flag as provisional.
    preliminary: () => false,
    candidates: parkrunPdfCandidates,
  },
}

export function platformReadsResultsPdf(platform: ResultsPlatform): boolean {
  return platform in READERS
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

function daysApart(left: Date, right: Date): number {
  const toDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.abs(toDay(left) - toDay(right)) / 86_400_000
}

export function validateResultsPdfFile(file: File): ResultsPdfErrorCode | null {
  if (!isPdfFile(file) || file.size === 0) return 'unsupported_type'
  if (file.size > MAX_RESULTS_PDF_BYTES) return 'file_too_large'
  return null
}

/**
 * Reads a results document the runner saved and finds them in it.
 *
 * `readText` is injected so the reading rules can be tested without pdfjs, and
 * so nothing drags the reader into the bundle at import time.
 */
export async function importResultsPdf(
  file: File,
  event: ResultsPdfEvent,
  profile: UserResultsProfile,
  readText: (file: File) => Promise<string> = extractPdfText,
): Promise<ResultsPdfResult> {
  const invalid = validateResultsPdfFile(file)
  if (invalid) return { ok: false, code: invalid }

  const reader = READERS[event.platform]
  if (!reader) return { ok: false, code: 'not_a_results_pdf' }

  let text: string
  try {
    text = await readText(file)
  } catch {
    return { ok: false, code: 'unreadable' }
  }

  if (!reader.matches(text)) return { ok: false, code: 'not_a_results_pdf' }

  const printed = reader.eventDates(text)
  const sameDay =
    printed.length === 0 || printed.some((date) => daysApart(date, event.date) <= DATE_TOLERANCE_DAYS)
  if (!sameDay) {
    return { ok: false, code: 'wrong_event', pdfEventName: reader.eventName(text) }
  }

  const matched = reader.candidates(text, profile, event.resultsUrl?.trim() || file.name)
  if (matched.length === 0) return { ok: false, code: 'name_not_found' }

  return {
    ok: true,
    result: {
      candidates: matched.slice(0, MAX_RESULTS_PDF_CANDIDATES),
      truncated: matched.length > MAX_RESULTS_PDF_CANDIDATES,
      eventName: reader.eventName(text),
      preliminary: reader.preliminary(text),
    },
  }
}
