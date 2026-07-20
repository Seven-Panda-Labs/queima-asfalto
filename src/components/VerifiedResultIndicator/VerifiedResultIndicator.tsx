import { useTranslation } from 'react-i18next'

type VerifiedResultIndicatorProps = {
  className?: string
}

export function VerifiedResultIndicator({ className = 'h-3.5 w-3.5' }: VerifiedResultIndicatorProps) {
  const { t } = useTranslation()

  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      role="img"
      aria-label={t('results.verified')}
      className={['inline-block shrink-0 text-success', className].join(' ')}
    >
      <title>{t('results.verified')}</title>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}
