import { describe, expect, it } from 'vitest'
import i18n from './index'

/**
 * The forms keep an error as a key and translate it when they render it, so the
 * message follows a language switch and the effect that set it does not depend
 * on the translator.
 *
 * That leans on two i18next behaviours, and both are worth pinning: a key
 * resolves, and anything else comes back as itself. The second one matters
 * because a thrown error's message goes through the same call, and a message
 * with a full stop in it looks exactly like a nested key path.
 */
describe('an error message rendered through t', () => {
  const render = (value: string) => i18n.t(value, { defaultValue: value })

  it('translates a key', () => {
    expect(render('errors.goalNotFound')).not.toBe('errors.goalNotFound')
    expect(render('errors.goalNotFound')).toBe(i18n.t('errors.goalNotFound'))
  })

  it('gives a raw message back, dots and all', () => {
    // Firestore's own wording, which is not a key and must not be read as one.
    expect(render('Missing or insufficient permissions.')).toBe(
      'Missing or insufficient permissions.',
    )
    expect(render('Failed to fetch')).toBe('Failed to fetch')
  })

  it('follows the language, which is the point of translating late', async () => {
    const before = render('errors.goalNotFound')
    await i18n.changeLanguage('en')
    const after = render('errors.goalNotFound')
    await i18n.changeLanguage('pt')
    expect(after).not.toBe(before)
  })
})
