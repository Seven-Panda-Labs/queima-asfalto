import type { AppLanguage } from '../shared/account/types.js'
import type { ApprovalAction } from './approvalToken.js'
import { createApprovalToken } from './approvalToken.js'
import { getAdminNewUserCopy, getUserApprovedCopy, getUserRejectedCopy } from './copy.js'
import { renderEmailHtml } from './layout.js'

export function buildAdminNewUserEmail(params: {
  instanceName: string
  appPublicUrl: string
  approvalHandlerBaseUrl: string
  tokenSecret: string
  uid: string
  name: string
  email: string
  language: AppLanguage
}): { subject: string; html: string } {
  const copy = getAdminNewUserCopy(params.language)
  const approveToken = createApprovalToken(params.tokenSecret, params.uid, 'approve')
  const rejectToken = createApprovalToken(params.tokenSecret, params.uid, 'reject')
  const approveUrl = `${params.approvalHandlerBaseUrl}?token=${encodeURIComponent(approveToken)}`
  const rejectUrl = `${params.approvalHandlerBaseUrl}?token=${encodeURIComponent(rejectToken)}`

  const html = renderEmailHtml({
    instanceName: params.instanceName,
    appPublicUrl: params.appPublicUrl,
    title: copy.title,
    bodyHtml: copy.body({ name: params.name, email: params.email }),
    cta: { label: copy.approveLabel, href: approveUrl, variant: 'primary' },
    secondaryCta: { label: copy.rejectLabel, href: rejectUrl, variant: 'danger' },
  })

  return { subject: `[${params.instanceName}] ${copy.subject}`, html }
}

export function buildUserApprovedEmail(params: {
  instanceName: string
  appPublicUrl: string
  language: AppLanguage
}): { subject: string; html: string } {
  const copy = getUserApprovedCopy(params.language)
  const loginUrl = `${params.appPublicUrl.replace(/\/+$/, '')}/login`

  const html = renderEmailHtml({
    instanceName: params.instanceName,
    appPublicUrl: params.appPublicUrl,
    title: copy.title,
    bodyHtml: copy.body,
    cta: { label: copy.ctaLabel, href: loginUrl, variant: 'primary' },
  })

  return { subject: `[${params.instanceName}] ${copy.subject}`, html }
}

export function buildUserRejectedEmail(params: {
  instanceName: string
  appPublicUrl: string
  language: AppLanguage
}): { subject: string; html: string } {
  const copy = getUserRejectedCopy(params.language)
  const homeUrl = params.appPublicUrl.replace(/\/+$/, '') || '/'

  const html = renderEmailHtml({
    instanceName: params.instanceName,
    appPublicUrl: params.appPublicUrl,
    title: copy.title,
    bodyHtml: copy.body,
    cta: { label: copy.ctaLabel, href: homeUrl, variant: 'primary' },
  })

  return { subject: `[${params.instanceName}] ${copy.subject}`, html }
}

export function buildActionResultPage(params: {
  instanceName: string
  appPublicUrl: string
  action: ApprovalAction
  success: boolean
  message: string
}): string {
  const title = params.success
    ? params.action === 'approve'
      ? 'Account approved'
      : 'Account rejected'
    : 'Action failed'

  return renderEmailHtml({
    instanceName: params.instanceName,
    appPublicUrl: params.appPublicUrl,
    title,
    bodyHtml: `<p>${params.message}</p>`,
    cta: params.success
      ? { label: 'Open the app', href: params.appPublicUrl, variant: 'primary' }
      : undefined,
  })
}
