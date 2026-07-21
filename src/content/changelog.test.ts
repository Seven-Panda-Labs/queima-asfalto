import { describe, expect, it } from 'vitest'
import packageJson from '../../package.json'
import {
  getChangelogMarkdown,
  prepareChangelogForDisplay,
  resolveChangelogLocale,
} from './changelog'

describe('resolveChangelogLocale', () => {
  it('maps english variants to en', () => {
    expect(resolveChangelogLocale('en')).toBe('en')
    expect(resolveChangelogLocale('en-GB')).toBe('en')
  })

  it('defaults other languages to pt', () => {
    expect(resolveChangelogLocale('pt')).toBe('pt')
    expect(resolveChangelogLocale('pt-PT')).toBe('pt')
  })
})

describe('prepareChangelogForDisplay', () => {
  it('keeps content from the first version heading', () => {
    const input = `# Changelog

Maintenance notes.

---

## [1.5.0] — 2026-07-08

### Adicionado
- Item`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.5.0] — 2026-07-08

### Adicionado
- Item`)
  })

  it('removes legend and references appendix sections', () => {
    const input = `## [1.0.0] — 2026-01-01

### Adicionado
- Item

---

## Legenda

| Tipo | Significado |
|------|-------------|
| **Adicionado** | Funcionalidades novas |

## Referências

- [Issues GitHub](https://github.com/Seven-Panda-Labs/queima-asfalto/issues)`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.0.0] — 2026-01-01

### Adicionado
- Item

---`)
  })

  it('removes english legend and references appendix sections', () => {
    const input = `## [1.0.0] — 2026-01-01

### Added
- Item

## Legend

| Type | Meaning |

## References

- [GitHub Issues](https://github.com/Seven-Panda-Labs/queima-asfalto/issues)`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.0.0] — 2026-01-01

### Added
- Item`)
  })
})

describe('getChangelogMarkdown', () => {
  const versionPattern = new RegExp(`^## \\[${packageJson.version.replace(/\./g, '\\.')}\\]`)

  it('includes the current package version in pt changelog', () => {
    expect(getChangelogMarkdown('pt')).toMatch(versionPattern)
  })

  it('includes the current package version in en changelog', () => {
    expect(getChangelogMarkdown('en')).toMatch(versionPattern)
  })

  it('omits legend and references appendix from displayed changelog', () => {
    expect(getChangelogMarkdown('pt')).not.toMatch(/^## (Legenda|Referências)/m)
    expect(getChangelogMarkdown('en')).not.toMatch(/^## (Legend|References)/m)
  })
})
