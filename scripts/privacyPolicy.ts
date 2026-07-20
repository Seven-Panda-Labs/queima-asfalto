import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type PrivacyPolicyLocale = 'pt' | 'en'

export type PrivacyPolicyValues = {
  INSTANCE_NAME: string
  CONTROLLER_NAME: string
  CONTACT_EMAIL: string
  HOSTING_URL: string
  EFFECTIVE_DATE: string
  FIREBASE_REGION: string
  USES_ANALYTICS: string
  USES_GEOAPIFY: string
  USES_PUSH: string
  RETENTION_POLICY: string
}

const REQUIRED_KEYS = [
  'PRIVACY_INSTANCE_NAME',
  'PRIVACY_CONTROLLER_NAME',
  'PRIVACY_CONTACT_EMAIL',
  'PRIVACY_HOSTING_URL',
] as const

const DEFAULT_RETENTION_PT =
  'Pedidos de apagamento por email; resposta em até 30 dias.'
const DEFAULT_RETENTION_EN =
  'Erasure requests by email; response within 30 days.'

export function loadEnvFile(path: string, env: NodeJS.ProcessEnv = process.env): void {
  let content: string
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    return
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in env) || env[key] === '') {
      env[key] = value
    }
  }
}

function isSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function yesNoPt(enabled: boolean): string {
  return enabled ? 'sim' : 'não'
}

function yesNoEn(enabled: boolean): string {
  return enabled ? 'yes' : 'no'
}

export function missingPrivacyEnvKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  return REQUIRED_KEYS.filter((key) => !isSet(env[key]))
}

export function resolvePrivacyPolicyValues(
  env: NodeJS.ProcessEnv = process.env,
  now = new Date(),
): PrivacyPolicyValues | null {
  const missing = missingPrivacyEnvKeys(env)
  if (missing.length > 0) return null

  const usesAnalytics = isSet(env.VITE_FIREBASE_MEASUREMENT_ID)
  const usesGeoapify = isSet(env.VITE_GEOAPIFY_API_KEY)
  const usesPush = isSet(env.VITE_FIREBASE_VAPID_KEY)

  const retentionPt = env.PRIVACY_RETENTION_POLICY_PT?.trim() || DEFAULT_RETENTION_PT

  return {
    INSTANCE_NAME: env.PRIVACY_INSTANCE_NAME!.trim(),
    CONTROLLER_NAME: env.PRIVACY_CONTROLLER_NAME!.trim(),
    CONTACT_EMAIL: env.PRIVACY_CONTACT_EMAIL!.trim(),
    HOSTING_URL: env.PRIVACY_HOSTING_URL!.trim(),
    EFFECTIVE_DATE: now.toISOString().slice(0, 10),
    FIREBASE_REGION: env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || 'europe-west1',
    USES_ANALYTICS: yesNoPt(usesAnalytics),
    USES_GEOAPIFY: yesNoPt(usesGeoapify),
    USES_PUSH: yesNoPt(usesPush),
    RETENTION_POLICY: retentionPt,
  }
}

export function resolvePrivacyPolicyValuesForLocale(
  values: PrivacyPolicyValues,
  locale: PrivacyPolicyLocale,
  env: NodeJS.ProcessEnv = process.env,
): PrivacyPolicyValues {
  const usesAnalytics = values.USES_ANALYTICS === 'sim'
  const usesGeoapify = values.USES_GEOAPIFY === 'sim'
  const usesPush = values.USES_PUSH === 'sim'

  if (locale === 'pt') {
    return {
      ...values,
      RETENTION_POLICY: env.PRIVACY_RETENTION_POLICY_PT?.trim() || DEFAULT_RETENTION_PT,
    }
  }

  return {
    ...values,
    USES_ANALYTICS: yesNoEn(usesAnalytics),
    USES_GEOAPIFY: yesNoEn(usesGeoapify),
    USES_PUSH: yesNoEn(usesPush),
    RETENTION_POLICY: env.PRIVACY_RETENTION_POLICY_EN?.trim() || DEFAULT_RETENTION_EN,
  }
}

export function substitutePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => {
    return key in values ? values[key] : match
  })
}

export function parseLocaleSections(template: string): Map<PrivacyPolicyLocale, string> {
  const sections = new Map<PrivacyPolicyLocale, string>()
  const pattern = /^---locale:(pt|en)---$/gm
  const matches = [...template.matchAll(pattern)]

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const locale = match[1] as PrivacyPolicyLocale
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? template.length) : template.length
    sections.set(locale, template.slice(start, end).trim())
  }

  return sections
}

export function loadPrivacyPolicyTemplate(rootDir: string): string {
  return readFileSync(resolve(rootDir, 'scripts/privacy-policy.template.md'), 'utf8')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line.trim())
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const parts: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (line.trim() === '') {
      index += 1
      continue
    }

    if (line.startsWith('#### ')) {
      parts.push(`<h2>${inlineMarkdown(line.slice(5))}</h2>`)
      index += 1
      continue
    }

    if (line.startsWith('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const header = parseTableRow(line)
      index += 2
      const rows: string[][] = []
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[index]))
        index += 1
      }
      const thead = `<thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`,
        )
        .join('')}</tbody>`
      parts.push(`<table>${thead}${tbody}</table>`)
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(`<li>${inlineMarkdown(lines[index].slice(2))}</li>`)
        index += 1
      }
      parts.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].startsWith('#### ') &&
      !lines[index].startsWith('|') &&
      !lines[index].startsWith('- ')
    ) {
      paragraphLines.push(lines[index])
      index += 1
    }
    parts.push(`<p>${inlineMarkdown(paragraphLines.join(' '))}</p>`)
  }

  return parts.join('\n')
}

export function wrapPrivacyPolicyHtml(options: {
  title: string
  lang: PrivacyPolicyLocale
  bodyHtml: string
  alternateHref: string
  alternateLabel: string
}): string {
  const { title, lang, bodyHtml, alternateHref, alternateLabel } = options
  return `<!DOCTYPE html>
<html lang="${lang === 'pt' ? 'pt-PT' : 'en-GB'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      line-height: 1.6;
      max-width: 48rem;
      margin: 0 auto;
      padding: 1.5rem;
      background: #f9fafb;
      color: #111827;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #111827; color: #f3f4f6; }
      a { color: #93c5fd; }
      table, th, td { border-color: #374151; }
    }
    a { color: #2563eb; }
    h2 { margin-top: 2rem; font-size: 1.125rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: rgba(37, 99, 235, 0.08); }
    code { font-size: 0.85em; }
    .lang-switch { font-size: 0.875rem; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <p class="lang-switch"><a href="${alternateHref}">${escapeHtml(alternateLabel)}</a></p>
  <article>${bodyHtml}</article>
</body>
</html>`
}
