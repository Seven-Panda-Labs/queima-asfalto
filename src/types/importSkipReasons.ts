export const IMPORT_SKIP_REASONS = {
  EMPTY_ROW: 'empty_row',
  NOTE_ROW: 'note_row',
  INVALID_TEXT_DATE: 'invalid_text_date',
  MISSING_EVENT_NAME: 'missing_event_name',
  MISSING_DATE: 'missing_date',
  INVALID_DATA: 'invalid_data',
} as const

export type ImportSkipReason = (typeof IMPORT_SKIP_REASONS)[keyof typeof IMPORT_SKIP_REASONS]

/** Legacy PT strings stored before canonical codes. */
const LEGACY_SKIP_REASON_MAP: Record<string, ImportSkipReason> = {
  'Linha vazia': IMPORT_SKIP_REASONS.EMPTY_ROW,
  'Linha de notas': IMPORT_SKIP_REASONS.NOTE_ROW,
  'Data textual inválida': IMPORT_SKIP_REASONS.INVALID_TEXT_DATE,
  'Nome do evento em falta': IMPORT_SKIP_REASONS.MISSING_EVENT_NAME,
  'Data em falta': IMPORT_SKIP_REASONS.MISSING_DATE,
  'Dados inválidos': IMPORT_SKIP_REASONS.INVALID_DATA,
}

export function normalizeImportSkipReason(reason: string): ImportSkipReason | string {
  if (Object.values(IMPORT_SKIP_REASONS).includes(reason as ImportSkipReason)) {
    return reason
  }
  return LEGACY_SKIP_REASON_MAP[reason] ?? reason
}
