import type { AppLanguage } from '../shared/account/types.js'
import {
  getAppPublicUrl,
  getApprovalHandlerBaseUrl,
  getApprovalTokenSecret,
  getEmailFrom,
  getInstanceName,
  getResendApiKey,
} from './config.js'
import { buildAdminNewUserEmail, buildUserApprovedEmail, buildUserRejectedEmail } from '../email/templates.js'
import { sendEmailViaResend } from '../email/send.js'
import { resolveEmailLanguage } from '../email/layout.js'

export async function notifyAdminNewUser(params: {
  uid: string
  name: string
  email: string
  /** Where to send it. Empty on an instance with no operator yet. */
  adminEmails: string[]
  registrationLocale?: AppLanguage
}): Promise<void> {
  const apiKey = getResendApiKey()
  const from = getEmailFrom()
  const appPublicUrl = getAppPublicUrl()
  const handlerBaseUrl = getApprovalHandlerBaseUrl()
  const tokenSecret = getApprovalTokenSecret()

  if (
    params.adminEmails.length === 0 ||
    !apiKey ||
    !from ||
    !appPublicUrl ||
    !handlerBaseUrl ||
    !tokenSecret
  ) {
    return
  }

  const language = resolveEmailLanguage(params.registrationLocale, 'en')
  const { subject, html } = buildAdminNewUserEmail({
    instanceName: getInstanceName(),
    appPublicUrl,
    approvalHandlerBaseUrl: handlerBaseUrl,
    tokenSecret,
    uid: params.uid,
    name: params.name,
    email: params.email,
    language,
  })

  // One mail each rather than one with several recipients, so one bad address
  // cannot take the others down with it.
  for (const to of params.adminEmails) {
    await sendEmailViaResend({ apiKey, from, to, subject, html })
  }
}

export async function notifyUserApproved(params: {
  email: string
  registrationLocale?: AppLanguage
}): Promise<void> {
  const apiKey = getResendApiKey()
  const from = getEmailFrom()
  const appPublicUrl = getAppPublicUrl()
  if (!apiKey || !from || !appPublicUrl || !params.email.includes('@')) {
    return
  }

  const language = resolveEmailLanguage(params.registrationLocale, 'en')
  const { subject, html } = buildUserApprovedEmail({
    instanceName: getInstanceName(),
    appPublicUrl,
    language,
  })

  await sendEmailViaResend({
    apiKey,
    from,
    to: params.email,
    subject,
    html,
  })
}

export async function notifyUserRejected(params: {
  email: string
  registrationLocale?: AppLanguage
}): Promise<void> {
  const apiKey = getResendApiKey()
  const from = getEmailFrom()
  const appPublicUrl = getAppPublicUrl()
  if (!apiKey || !from || !appPublicUrl || !params.email.includes('@')) {
    return
  }

  const language = resolveEmailLanguage(params.registrationLocale, 'en')
  const { subject, html } = buildUserRejectedEmail({
    instanceName: getInstanceName(),
    appPublicUrl,
    language,
  })

  await sendEmailViaResend({
    apiKey,
    from,
    to: params.email,
    subject,
    html,
  })
}
