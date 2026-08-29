import { beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { reportLoadError } from './loadError'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

describe('reportLoadError', () => {
  it('returns the translated message, never the original', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const raw = new Error("evaluation error at L323:22 for 'list' @ L323")

    const shown = reportLoadError(raw, 'errors.eventsLoadError', 'useEvents')

    expect(shown).toBe(i18n.t('errors.eventsLoadError'))
    expect(shown).not.toContain('L323')
    spy.mockRestore()
  })

  it('sends the original to the console with its context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const raw = new Error('permission-denied')

    reportLoadError(raw, 'errors.goalsLoadError', 'useGoals')

    expect(spy).toHaveBeenCalledWith('useGoals:', raw)
    spy.mockRestore()
  })

  it('copes with something thrown that is not an Error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(reportLoadError('boom', 'errors.unknown', 'useShares')).toBe(i18n.t('errors.unknown'))
    spy.mockRestore()
  })
})
