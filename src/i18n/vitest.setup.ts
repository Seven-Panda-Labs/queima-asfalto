import { beforeAll } from 'vitest'
import { applyLanguage, initI18n } from './index'

beforeAll(async () => {
  // Server side suites run in the node environment, where there is no navigator
  // to pin and no UI to translate.
  if (typeof window === 'undefined') return

  Object.defineProperty(window.navigator, 'language', {
    value: 'pt-PT',
    configurable: true,
  })
  await initI18n()
  await applyLanguage('pt')
})
