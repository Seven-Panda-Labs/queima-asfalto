function parseTruthy(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function isAccountApprovalRequired(): boolean {
  return parseTruthy(process.env.ACCOUNT_APPROVAL_REQUIRED)
}

export function getAppPublicUrl(): string | undefined {
  const url = process.env.APP_PUBLIC_URL?.trim()
  if (!url) {
    return undefined
  }
  return url.replace(/\/+$/, '')
}

export function getApprovalHandlerBaseUrl(): string | undefined {
  const explicit = process.env.APPROVAL_HANDLER_BASE_URL?.trim().replace(/\/+$/, '')
  if (explicit) {
    return explicit
  }
  const appUrl = getAppPublicUrl()
  if (!appUrl) {
    return undefined
  }
  return `${appUrl}/api/account-approval`
}

export function getInstanceName(): string {
  const name = process.env.INSTANCE_NAME?.trim()
  return name && name.length > 0 ? name : 'Queima Asfalto'
}

export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim()
  return key && key.length > 0 ? key : undefined
}

export function getEmailFrom(): string | undefined {
  const from = process.env.EMAIL_FROM?.trim()
  return from && from.includes('@') ? from : undefined
}

export function getApprovalTokenSecret(): string | undefined {
  const secret = process.env.APPROVAL_TOKEN_SECRET?.trim()
  return secret && secret.length >= 16 ? secret : undefined
}

export function assertAccountApprovalConfig(): void {
  if (!isAccountApprovalRequired()) {
    return
  }

  const missing: string[] = []
  if (!getAppPublicUrl()) {
    missing.push('APP_PUBLIC_URL')
  }
  if (!getResendApiKey()) {
    missing.push('RESEND_API_KEY')
  }
  if (!getEmailFrom()) {
    missing.push('EMAIL_FROM')
  }
  if (!getApprovalTokenSecret()) {
    missing.push('APPROVAL_TOKEN_SECRET')
  }

  if (missing.length > 0) {
    throw new Error(
      `ACCOUNT_APPROVAL_REQUIRED is enabled but missing: ${missing.join(', ')}`,
    )
  }
}
