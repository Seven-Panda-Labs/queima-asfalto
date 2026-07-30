export const EMAIL_BRAND = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  foreground: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  fontSans: "'Poppins', Arial, sans-serif",
  fontDisplay: "'Bebas Neue', sans-serif",
} as const

export function brandLogoUrl(appPublicUrl: string): string {
  return `${appPublicUrl.replace(/\/+$/, '')}/queima-asfalto-logo.png`
}
