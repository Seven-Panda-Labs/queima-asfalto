export function isPrivacyPolicyEnabled(): boolean {
  return import.meta.env.VITE_PRIVACY_POLICY_ENABLED === 'true'
}

export const PRIVACY_POLICY_PATH = '/privacidade'

export function privacyPolicyPath(): string {
  return PRIVACY_POLICY_PATH
}
