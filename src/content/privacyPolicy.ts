import { privacyPolicyContent } from '#privacy-policy-content'

export type PrivacyPolicyLocale = 'pt' | 'en'

export function resolvePrivacyPolicyLocale(language: string): PrivacyPolicyLocale {
  return language.startsWith('en') ? 'en' : 'pt'
}

export function isPrivacyPolicyAvailable(): boolean {
  return privacyPolicyContent.enabled
}

export function getPrivacyPolicyMarkdown(locale: PrivacyPolicyLocale): string {
  return locale === 'en' ? privacyPolicyContent.en : privacyPolicyContent.pt
}

export function getPrivacyPolicyInstanceName(): string {
  return privacyPolicyContent.instanceName
}
