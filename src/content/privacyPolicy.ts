import { privacyPolicyContent } from '#privacy-policy-content'
import type { AppLanguage } from '../i18n/languages'

export function isPrivacyPolicyAvailable(): boolean {
  return privacyPolicyContent.enabled
}

export function getPrivacyPolicyMarkdown(locale: AppLanguage): string {
  return privacyPolicyContent[locale]
}

export function getPrivacyPolicyInstanceName(): string {
  return privacyPolicyContent.instanceName
}
