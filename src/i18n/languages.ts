export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'de'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
