function parseTruthy(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function isAccountApprovalRequired(): boolean {
  return parseTruthy(process.env.ACCOUNT_APPROVAL_REQUIRED)
}

export function getAdminEmail(): string | undefined {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  return email && email.includes('@') ? email : undefined
}

export function getAppPublicUrl(): string | undefined {
  const url = process.env.APP_PUBLIC_URL?.trim()
  if (!url) {
    return undefined
  }
  return url.replace(/\/+$/, '')
}

export function assertAccountApprovalConfig(): void {
  if (!isAccountApprovalRequired()) {
    return
  }

  const missing: string[] = []
  if (!getAdminEmail()) {
    missing.push('ADMIN_EMAIL')
  }
  if (!getAppPublicUrl()) {
    missing.push('APP_PUBLIC_URL')
  }

  if (missing.length > 0) {
    throw new Error(
      `ACCOUNT_APPROVAL_REQUIRED is enabled but missing: ${missing.join(', ')}`,
    )
  }
}
