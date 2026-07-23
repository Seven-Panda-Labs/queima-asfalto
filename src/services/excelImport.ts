import type { ParseBucketListResult } from './excelBucketListParser'
import { parseBucketListFromWorkbook } from './excelBucketListParser'
import type { ParsedGoal } from './excelGoalParser'
import { extractGoalsFromWorkbook } from './excelGoalParser'
import type { ParseWorkbookResult } from './excelParser'
import { parseWorkbookFromWorkbook } from './excelParser'
import { loadXlsx } from './xlsxLoader'

export type ImportParseResult = {
  parsed: ParseWorkbookResult
  goals: ParsedGoal[]
  bucketList: ParseBucketListResult
}

export async function parseImportWorkbook(buffer: ArrayBuffer): Promise<ImportParseResult> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })

  return {
    parsed: parseWorkbookFromWorkbook(workbook, XLSX),
    goals: extractGoalsFromWorkbook(workbook, XLSX),
    bucketList: parseBucketListFromWorkbook(workbook, XLSX),
  }
}
