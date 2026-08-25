export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'de', 'fr'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
