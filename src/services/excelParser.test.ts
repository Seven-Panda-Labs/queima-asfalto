import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { IMPORT_SKIP_REASONS } from '../types/importSkipReasons'
import { deriveEventType } from '../utils/eventValidation'
import { parseWorkbook } from './excelParser'

function workbookToBuffer(build: (wb: XLSX.WorkBook) => void): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  build(workbook)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseWorkbook legacy Plano sheets', () => {
  it('maps Corrido to Concluído and parses event row', () => {
    const buffer = workbookToBuffer((wb) => {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['Local', 'Data', 'Evento(s)', 'Distância', 'Estado', 'Tempo', 'Ritmo', 'Classificação'],
        ['Berlin', 46053, 'ParkRun Test', 5, 'Corrido', '00:25:30', '5:06', '9/25'],
      ])
      XLSX.utils.book_append_sheet(wb, sheet, 'Plano 2026')
    })

    const { events, skipped } = parseWorkbook(buffer)
    expect(events).toHaveLength(1)
    expect(events[0].event.status).toBe('completed')
    expect(events[0].event.name).toBe('ParkRun Test')
    expect(skipped).toHaveLength(0)
  })

  it('maps Perdido to Faltou', () => {
    const buffer = workbookToBuffer((wb) => {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['Local', 'Data', 'Evento(s)', 'Distância', 'Estado'],
        ['Lisboa', 46053, 'Corrida', 10, 'Perdido'],
      ])
      XLSX.utils.book_append_sheet(wb, sheet, 'Plano 2026')
    })

    const { events } = parseWorkbook(buffer)
    expect(events[0].event.status).toBe('missed')
  })

  it('skips note rows like Parkruns?', () => {
    const buffer = workbookToBuffer((wb) => {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['Local', 'Data', 'Evento(s)', 'Distância', 'Estado'],
        ['', '', 'Parkruns?', '', ''],
      ])
      XLSX.utils.book_append_sheet(wb, sheet, 'Plano 2026')
    })

    const { events, skipped } = parseWorkbook(buffer)
    expect(events).toHaveLength(0)
    expect(skipped.some((row) => row.reason === IMPORT_SKIP_REASONS.NOTE_ROW)).toBe(true)
  })

  it('supports Plano 2022 layout with date in first column', () => {
    const buffer = workbookToBuffer((wb) => {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['', 'Local', 'Evento(s)', 'Distância', 'Estado'],
        [46053, 'Berlin', 'Legacy Run', 5, 'planned'],
      ])
      XLSX.utils.book_append_sheet(wb, sheet, 'Plano 2022')
    })

    const { events } = parseWorkbook(buffer)
    expect(events).toHaveLength(1)
    expect(events[0].event.status).toBe('planned')
  })
})

describe('deriveEventType', () => {
  it('maps distances to event types', () => {
    expect(deriveEventType(5)).toBe('km_5')
    expect(deriveEventType(21.1)).toBe('km_21_1')
  })
})

describe('parseWorkbook export format', () => {
  it('imports exported app format (round-trip)', () => {
    const buffer = workbookToBuffer((wb) => {
      const sheet = XLSX.utils.json_to_sheet([
        {
          Data: '31/01/2026',
          Evento: 'Export Test',
          'Distância Real (Km)': 5,
          'Tipo de Evento': 'km_5',
          Local: 'Berlin',
          Estado: 'completed',
          Tempo: '00:25:00',
          Ritmo: '5:00',
          Classificação: '10/100',
          Notas: 'Nota teste',
        },
      ])
      XLSX.utils.book_append_sheet(wb, sheet, 'Eventos')
    })

    const { events } = parseWorkbook(buffer)
    expect(events).toHaveLength(1)
    expect(events[0].event.name).toBe('Export Test')
    expect(events[0].event.eventType).toBe('km_5')
    expect(events[0].event.status).toBe('completed')
    expect(events[0].event.time).toBe('00:25:00')
    expect(events[0].event.classification).toBe('10/100')
  })
})
