import { privacyPolicyContent } from '#privacy-policy-content'
import { resolveContentLocale, type ContentLocale } from '../i18n/locale'

export type PrivacyPolicyLocale = ContentLocale

export function resolvePrivacyPolicyLocale(language: string): PrivacyPolicyLocale {
  return resolveContentLocale(language)
}

export function isPrivacyPolicyAvailable(): boolean {
  return privacyPolicyContent.enabled
}

export function getPrivacyPolicyMarkdown(locale: PrivacyPolicyLocale): string {
  return privacyPolicyContent[locale]
}

export function getPrivacyPolicyInstanceName(): string {
  return privacyPolicyContent.instanceName
}
