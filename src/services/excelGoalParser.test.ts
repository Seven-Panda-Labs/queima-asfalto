import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { extractGoalsFromExcel } from './excelGoalParser'

function workbookToBuffer(rows: unknown[][], sheetName: string): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('extractGoalsFromExcel', () => {
  it('extracts 5x 5Km goal from sheet text', async () => {
    const buffer = workbookToBuffer(
      [['Objectivos: 5x 5Km ✅', '', ''], ['', '', '']],
      'Plano 2026',
    )

    const goals = await extractGoalsFromExcel(buffer)
    expect(goals).toHaveLength(1)
    expect(goals[0].goal.targetCount).toBe(5)
    expect(goals[0].goal.eventType).toBe('km_5')
    expect(goals[0].year).toBe(2026)
  })

  it('deduplicates repeated goal mentions in same sheet', async () => {
    const buffer = workbookToBuffer(
      [
        ['Objectivos: 5x 5Km', ''],
        ['Meta: 5x 5Km', ''],
      ],
      'Plano 2025',
    )

    const goals = await extractGoalsFromExcel(buffer)
    expect(goals).toHaveLength(1)
  })
})
