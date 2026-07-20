import * as XLSX from 'xlsx'
import type { EventType } from '../types/Event'
import type { GoalCreate } from '../types/Goal'

export type ParsedGoal = {
  goal: GoalCreate
  sheet: string
  year: number
}

const GOAL_PATTERN = /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*km/gi

function distanceToEventType(distance: number): EventType {
  if (distance <= 6) return 'km_5'
  if (distance <= 11) return 'km_10'
  return 'km_21_1'
}

function yearFromSheetName(sheetName: string): number | null {
  const match = /Plano\s+(\d{4})/i.exec(sheetName)
  if (!match) return null
  return Number(match[1])
}

function extractGoalsFromText(text: string, year: number): GoalCreate[] {
  const goals: GoalCreate[] = []
  const pattern = new RegExp(GOAL_PATTERN.source, 'gi')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const targetCount = Number(match[1])
    const distance = Number(match[2])
    if (!Number.isInteger(targetCount) || targetCount < 1 || distance <= 0) continue

    goals.push({
      targetCount,
      eventType: distanceToEventType(distance),
      year,
    })
  }

  return goals
}

export function extractGoalsFromWorkbook(buffer: ArrayBuffer): ParsedGoal[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const parsed: ParsedGoal[] = []
  const seen = new Set<string>()

  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.startsWith('Plano')) continue

    const year = yearFromSheetName(sheetName)
    if (!year) continue

    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

    for (const row of rows) {
      const text = row.map((cell) => String(cell ?? '')).join(' ')
      const goals = extractGoalsFromText(text, year)

      for (const goal of goals) {
        const key = `${goal.year}|${goal.eventType}|${goal.targetCount}`
        if (seen.has(key)) continue
        seen.add(key)

        parsed.push({ goal, sheet: sheetName, year })
      }
    }
  }

  return parsed
}
