import { describe, expect, it } from 'vitest'
import packageJson from '../../package.json'
import { getChangelogMarkdown, prepareChangelogForDisplay } from './changelog'

describe('prepareChangelogForDisplay', () => {
  it('keeps content from the first version heading', () => {
    const input = `# Changelog

Maintenance notes.

---

## [1.5.0] - 2026-07-08

### Adicionado
- Item`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.5.0] - 2026-07-08

### Adicionado
- Item`)
  })

  it('removes legend and references appendix sections', () => {
    const input = `## [1.0.0] - 2026-01-01

### Adicionado
- Item

---

## Legenda

| Tipo | Significado |
|------|-------------|
| **Adicionado** | Funcionalidades novas |

## Referências

- [Issues GitHub](https://github.com/Seven-Panda-Labs/queima-asfalto/issues)`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.0.0] - 2026-01-01

### Adicionado
- Item

---`)
  })

  it('removes english legend and references appendix sections', () => {
    const input = `## [1.0.0] - 2026-01-01

### Added
- Item

## Legend

| Type | Meaning |

## References

- [GitHub Issues](https://github.com/Seven-Panda-Labs/queima-asfalto/issues)`

    expect(prepareChangelogForDisplay(input)).toBe(`## [1.0.0] - 2026-01-01

### Added
- Item`)
  })
})

describe('getChangelogMarkdown', () => {
  const versionPattern = new RegExp(`^## \\[${packageJson.version.replace(/\./g, '\\.')}\\]`)

  it('includes the current package version in pt changelog', async () => {
    await expect(getChangelogMarkdown('pt')).resolves.toMatch(versionPattern)
  })

  it('includes the current package version in en changelog', async () => {
    await expect(getChangelogMarkdown('en')).resolves.toMatch(versionPattern)
  })

  it('includes the current package version in es changelog', async () => {
    await expect(getChangelogMarkdown('es')).resolves.toMatch(versionPattern)
  })

  it('includes the current package version in de changelog', async () => {
    await expect(getChangelogMarkdown('de')).resolves.toMatch(versionPattern)
  })

  it('includes the current package version in fr changelog', async () => {
    await expect(getChangelogMarkdown('fr')).resolves.toMatch(versionPattern)
  })

  it('includes the current package version in ar changelog', async () => {
    await expect(getChangelogMarkdown('ar')).resolves.toMatch(versionPattern)
  })

  it('omits legend and references appendix from displayed changelog', async () => {
    await expect(getChangelogMarkdown('pt')).resolves.not.toMatch(/^## (Legenda|Referências)/m)
    await expect(getChangelogMarkdown('en')).resolves.not.toMatch(/^## (Legend|References)/m)
  })
})
