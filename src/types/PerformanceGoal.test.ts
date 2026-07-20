import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import {
  formatPerformanceGoalLabel,
  parsePerformanceGoalCreate,
  validatePerformanceGoalFields,
} from './PerformanceGoal'

describe('validatePerformanceGoalFields', () => {
  it('accepts pr_target without pace or time', () => {
    const errors = validatePerformanceGoalFields({
      type: 'pr_target',
      eventType: 'km_10',
      year: 2026,
    })
    expect(errors).toEqual({})
  })

  it('requires targetPace for pace_target', () => {
    const errors = validatePerformanceGoalFields({
      type: 'pace_target',
      eventType: 'km_10',
      year: 2026,
    })
    expect(errors.targetPace).toBeTruthy()
  })

  it('validates pace format for pace_target', () => {
    const errors = validatePerformanceGoalFields({
      type: 'pace_target',
      eventType: 'km_10',
      year: 2026,
      targetPace: 'invalid',
    })
    expect(errors.targetPace).toBeTruthy()
  })

  it('requires targetTime for time_target', () => {
    const errors = validatePerformanceGoalFields({
      type: 'time_target',
      eventType: 'km_21_1',
      year: 2026,
    })
    expect(errors.targetTime).toBeTruthy()
  })

  it('validates time format for time_target', () => {
    const errors = validatePerformanceGoalFields({
      type: 'time_target',
      eventType: 'km_21_1',
      year: 2026,
      targetTime: '1:45',
    })
    expect(errors.targetTime).toBeTruthy()
  })
})

describe('parsePerformanceGoalCreate', () => {
  it('normalizes valid pace_target', () => {
    const parsed = parsePerformanceGoalCreate({
      type: 'pace_target',
      eventType: 'km_5',
      year: 2026,
      targetPace: '5:05',
    })
    expect(parsed?.targetPace).toBe('5:05')
  })

  it('returns null when validation fails', () => {
    expect(
      parsePerformanceGoalCreate({
        type: 'time_target',
        eventType: 'km_5',
        year: 2026,
      }),
    ).toBeNull()
  })
})

describe('formatPerformanceGoalLabel', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('pt')
  })

  it('formats pr_target label', () => {
    expect(
      formatPerformanceGoalLabel({
        type: 'pr_target',
        eventType: 'km_10',
      }),
    ).toBe('Novo PR — 10Km')
  })

  it('formats pace_target label', () => {
    expect(
      formatPerformanceGoalLabel({
        type: 'pace_target',
        eventType: 'km_21_1',
        targetPace: '5:00',
      }),
    ).toBe('Ritmo alvo ≤ 5:00 — Meia Maratona')
  })
})
