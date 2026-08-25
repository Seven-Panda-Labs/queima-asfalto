import type { AppLanguage } from '../shared/account/types.js'
import { EMAIL_BRAND, brandLogoUrl } from './branding.js'

type EmailLayoutParams = {
  instanceName: string
  appPublicUrl: string
  title: string
  bodyHtml: string
  cta?: { label: string; href: string; variant?: 'primary' | 'danger' }
  secondaryCta?: { label: string; href: string; variant?: 'primary' | 'danger' }
  footerNote?: string
}

export function renderEmailHtml(params: EmailLayoutParams): string {
  const logoUrl = brandLogoUrl(params.appPublicUrl)
  const primaryButton = params.cta
    ? renderButton(params.cta.label, params.cta.href, params.cta.variant ?? 'primary')
    : ''
  const secondaryButton = params.secondaryCta
    ? `<div style="margin-top:12px;">${renderButton(
        params.secondaryCta.label,
        params.secondaryCta.href,
        params.secondaryCta.variant ?? 'danger',
      )}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:24px;background:${EMAIL_BRAND.background};font-family:${EMAIL_BRAND.fontSans};color:${EMAIL_BRAND.foreground};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:8px;">
    <tr>
      <td style="padding:32px 28px 16px;text-align:center;">
        <img src="${logoUrl}" alt="${escapeHtml(params.instanceName)}" width="280" style="max-width:100%;height:auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 0;text-align:center;">
        <h1 style="margin:0;font-family:${EMAIL_BRAND.fontDisplay};font-size:28px;letter-spacing:0.04em;color:${EMAIL_BRAND.primary};text-transform:uppercase;">${escapeHtml(params.title)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 8px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
        ${params.bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 28px;text-align:center;">
        ${primaryButton}
        ${secondaryButton}
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};text-align:center;">
        ${escapeHtml(params.footerNote ?? params.instanceName)}
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderButton(label: string, href: string, variant: 'primary' | 'danger'): string {
  const bg = variant === 'danger' ? EMAIL_BRAND.danger : EMAIL_BRAND.primary
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;border-radius:6px;background:${bg};color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">${escapeHtml(label)}</a>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function resolveEmailLanguage(
  registrationLocale: unknown,
  fallback: AppLanguage = 'en',
): AppLanguage {
  if (registrationLocale === 'pt' || registrationLocale === 'en' || registrationLocale === 'es' || registrationLocale === 'de' || registrationLocale === 'fr' || registrationLocale === 'ar') {
    return registrationLocale
  }
  return fallback
}
