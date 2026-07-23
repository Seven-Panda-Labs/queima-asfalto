import type { BucketListItem } from '../types/BucketListItem'
import type { Event } from '../types/Event'
import { formatEventStatusLabel, formatEventTypeLabel, isEnglishLocale } from '../i18n/formatters'
import { serializeDisciplinesCell } from '../utils/bucketListDisciplines'
import { formatDatePt } from '../utils/date'
import { loadXlsx } from './xlsxLoader'

const EXPORT_COLUMNS_PT = [
  'Data',
  'Evento',
  'Distância Real (Km)',
  'Tipo de Evento',
  'Local',
  'Estado',
  'Tempo',
  'Ritmo',
  'Classificação',
  'Notas',
] as const

const EXPORT_COLUMNS_EN = [
  'Date',
  'Event',
  'Real Distance (Km)',
  'Event Type',
  'Location',
  'Status',
  'Time',
  'Pace',
  'Classification',
  'Notes',
] as const

const BUCKET_LIST_COLUMNS = ['Event', 'Location', 'Approx. Dates', 'Link', 'Disciplines'] as const

type ExportColumnPt = (typeof EXPORT_COLUMNS_PT)[number]
type ExportColumnEn = (typeof EXPORT_COLUMNS_EN)[number]

function eventToRowPt(event: Event): Record<ExportColumnPt, string | number> {
  return {
    Data: formatDatePt(event.date),
    Evento: event.name,
    'Distância Real (Km)': event.realDistance,
    'Tipo de Evento': formatEventTypeLabel(event.eventType),
    Local: event.location,
    Estado: formatEventStatusLabel(event.status),
    Tempo: event.time ?? '',
    Ritmo: event.pace ?? '',
    Classificação: event.classification ?? '',
    Notas: event.notes ?? '',
  }
}

function eventToRowEn(event: Event): Record<ExportColumnEn, string | number> {
  return {
    Date: formatDatePt(event.date),
    Event: event.name,
    'Real Distance (Km)': event.realDistance,
    'Event Type': formatEventTypeLabel(event.eventType),
    Location: event.location,
    Status: formatEventStatusLabel(event.status),
    Time: event.time ?? '',
    Pace: event.pace ?? '',
    Classification: event.classification ?? '',
    Notes: event.notes ?? '',
  }
}

function bucketListItemToRow(
  item: BucketListItem,
): Record<(typeof BUCKET_LIST_COLUMNS)[number], string> {
  return {
    Event: item.name,
    Location: item.location,
    'Approx. Dates': item.targetMonth ?? '',
    Link: item.link ?? '',
    Disciplines: serializeDisciplinesCell(item.disciplines),
  }
}

export async function exportEventsToExcel(
  events: Event[],
  filename?: string,
  bucketListItems?: BucketListItem[],
): Promise<void> {
  const XLSX = await loadXlsx()
  const useEnglish = isEnglishLocale()
  const columns = useEnglish ? EXPORT_COLUMNS_EN : EXPORT_COLUMNS_PT
  const rows = useEnglish ? events.map(eventToRowEn) : events.map(eventToRowPt)
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...columns] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, useEnglish ? 'Events' : 'Eventos')

  if (bucketListItems && bucketListItems.length > 0) {
    const bucketRows = bucketListItems.map(bucketListItemToRow)
    const bucketSheet = XLSX.utils.json_to_sheet(bucketRows, { header: [...BUCKET_LIST_COLUMNS] })
    XLSX.utils.book_append_sheet(workbook, bucketSheet, '🪣Bucket list ')
  }

  const year = new Date().getFullYear()
  const defaultFilename = `queima_asfalto_eventos_${year}.xlsx`
  XLSX.writeFile(workbook, filename ?? defaultFilename)
}
