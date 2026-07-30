export function isAccountApprovalEnabled(): boolean {
  return import.meta.env.VITE_ACCOUNT_APPROVAL_REQUIRED?.trim().toLowerCase() === 'true'
}
