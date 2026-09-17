import {
  isMaxFunSportsPdfText,
  maxFunSportsPdfCandidates,
  maxFunSportsPdfEventDate,
  parseMaxFunSportsPdfText,
  type OfficialResultCandidate,
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
  resultsUrl?: string
}

/**
 * A day either side, the same tolerance the connectors use: an event is stored
 * at local midnight and the PDF prints the organiser's own calendar day.
 */
const DATE_TOLERANCE_DAYS = 1

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
 * Reads a results PDF the runner saved and finds them in it.
 *
 * `readText` is injected so the parsing rules can be tested without pdfjs, and
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

  let text: string
  try {
    text = await readText(file)
  } catch {
    return { ok: false, code: 'unreadable' }
  }

  if (!isMaxFunSportsPdfText(text)) return { ok: false, code: 'not_a_results_pdf' }

  const document = parseMaxFunSportsPdfText(text)
  const pdfDate = maxFunSportsPdfEventDate(document.header)
  if (pdfDate && daysApart(pdfDate, event.date) > DATE_TOLERANCE_DAYS) {
    return { ok: false, code: 'wrong_event', pdfEventName: document.header.eventName }
  }

  const matched = maxFunSportsPdfCandidates(
    document,
    profile,
    event.resultsUrl?.trim() || file.name,
  )
  if (matched.length === 0) return { ok: false, code: 'name_not_found' }

  return {
    ok: true,
    result: {
      candidates: matched.slice(0, MAX_RESULTS_PDF_CANDIDATES),
      truncated: matched.length > MAX_RESULTS_PDF_CANDIDATES,
      eventName: document.header.eventName,
      preliminary: document.header.preliminary,
    },
  }
}
