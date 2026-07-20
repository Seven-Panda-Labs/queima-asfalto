import { describe, expect, it } from 'vitest'
import {
  markdownToHtml,
  parseLocaleSections,
  resolvePrivacyPolicyValues,
  resolvePrivacyPolicyValuesForLocale,
  substitutePlaceholders,
} from '../scripts/privacyPolicy.js'

describe('substitutePlaceholders', () => {
  it('replaces known placeholders', () => {
    const result = substitutePlaceholders('Hello {{INSTANCE_NAME}} at {{HOSTING_URL}}', {
      INSTANCE_NAME: 'Test App',
      HOSTING_URL: 'https://example.test',
    })
    expect(result).toBe('Hello Test App at https://example.test')
  })

  it('leaves unknown placeholders intact', () => {
    expect(substitutePlaceholders('{{UNKNOWN}}', {})).toBe('{{UNKNOWN}}')
  })
})

describe('parseLocaleSections', () => {
  it('splits pt and en sections', () => {
    const template = `---locale:pt---\nPT body\n---locale:en---\nEN body`
    const sections = parseLocaleSections(template)
    expect(sections.get('pt')).toBe('PT body')
    expect(sections.get('en')).toBe('EN body')
  })
})

describe('resolvePrivacyPolicyValues', () => {
  it('returns null when required vars are missing', () => {
    expect(resolvePrivacyPolicyValues({})).toBeNull()
  })

  it('infers feature flags from VITE_* vars', () => {
    const values = resolvePrivacyPolicyValues(
      {
        PRIVACY_INSTANCE_NAME: 'Queima Asfalto',
        PRIVACY_CONTROLLER_NAME: 'Operator',
        PRIVACY_CONTACT_EMAIL: 'privacy@example.test',
        PRIVACY_HOSTING_URL: 'https://example.test',
        VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST',
        VITE_GEOAPIFY_API_KEY: 'geo-key',
        VITE_FIREBASE_VAPID_KEY: 'vapid',
        VITE_FIREBASE_FUNCTIONS_REGION: 'europe-west1',
      },
      new Date('2026-07-20T12:00:00Z'),
    )

    expect(values).toMatchObject({
      INSTANCE_NAME: 'Queima Asfalto',
      EFFECTIVE_DATE: '2026-07-20',
      FIREBASE_REGION: 'europe-west1',
      USES_ANALYTICS: 'sim',
      USES_GEOAPIFY: 'sim',
      USES_PUSH: 'sim',
    })
  })
})

describe('resolvePrivacyPolicyValuesForLocale', () => {
  it('localizes yes/no and retention for English', () => {
    const base = resolvePrivacyPolicyValues(
      {
        PRIVACY_INSTANCE_NAME: 'App',
        PRIVACY_CONTROLLER_NAME: 'Op',
        PRIVACY_CONTACT_EMAIL: 'a@b.c',
        PRIVACY_HOSTING_URL: 'https://x.test',
        VITE_GEOAPIFY_API_KEY: 'key',
      },
      new Date('2026-07-20T12:00:00Z'),
    )!

    const en = resolvePrivacyPolicyValuesForLocale(base, 'en')
    expect(en.USES_GEOAPIFY).toBe('yes')
    expect(en.USES_ANALYTICS).toBe('no')
    expect(en.RETENTION_POLICY).toContain('30 days')
  })
})

describe('markdownToHtml', () => {
  it('renders headings, links, and tables', () => {
    const html = markdownToHtml(`#### Title\n\nVisit [CNPD](https://www.cnpd.pt).\n\n| A | B |\n|---|---|\n| 1 | 2 |`)
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<a href="https://www.cnpd.pt">CNPD</a>')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })
})
