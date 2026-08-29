import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { getFaltouMessage } from './messages'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

describe('getFaltouMessage', () => {
  it('names the event, and the runner when there is a name', () => {
    const message = getFaltouMessage('Meia de Lisboa', 'Zé Ninguém')

    expect(message).toContain('Meia de Lisboa')
    expect(message).toContain('Zé')
  })

  it('reads without a name when there is none', () => {
    const message = getFaltouMessage('Meia de Lisboa')

    expect(message).toContain('Meia de Lisboa')
    expect(message.trim()).not.toBe('')
  })
})
