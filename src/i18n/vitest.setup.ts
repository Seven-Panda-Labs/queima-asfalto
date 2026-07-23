import { beforeAll } from 'vitest'
import { applyLanguage, initI18n } from './index'

beforeAll(async () => {
  Object.defineProperty(window.navigator, 'language', {
    value: 'pt-PT',
    configurable: true,
  })
  await initI18n()
  await applyLanguage('pt')
})
