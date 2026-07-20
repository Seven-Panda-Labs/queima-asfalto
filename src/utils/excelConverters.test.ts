import { describe, expect, it } from 'vitest'
import {
  excelFractionToTime,
  excelSerialToDate,
  isExcelFraction,
  parseExcelDate,
  parseExcelTime,
} from './excelConverters'

describe('excelSerialToDate', () => {
  it('converts serial 46053 to 2026-01-31', () => {
    const date = excelSerialToDate(46053)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(31)
  })
})

describe('excelFractionToTime', () => {
  it('converts fraction 0.02103 to valid hh:mm:ss', () => {
    const time = excelFractionToTime(0.02103)
    expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    const [hours, minutes, seconds] = time.split(':').map(Number)
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    expect(totalSeconds).toBeGreaterThan(1800)
    expect(totalSeconds).toBeLessThan(1900)
  })
})

describe('parseExcelDate', () => {
  it('parses pt-PT string date', () => {
    const date = parseExcelDate('31/01/2026')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(0)
    expect(date?.getDate()).toBe(31)
  })
})

describe('parseExcelTime', () => {
  it('detects fraction vs string', () => {
    expect(isExcelFraction(0.02103)).toBe(true)
    expect(parseExcelTime(0.02103)).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(parseExcelTime('00:30:17')).toBe('00:30:17')
  })
})
