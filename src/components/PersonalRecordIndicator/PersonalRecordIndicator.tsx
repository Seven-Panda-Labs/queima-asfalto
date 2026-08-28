import { useTranslation } from 'react-i18next'
import medalha from '../../../assets/medalha.svg'

type PersonalRecordIndicatorProps = {
  className?: string
}

export function PersonalRecordIndicator({ className = 'h-4 w-4' }: PersonalRecordIndicatorProps) {
  const { t } = useTranslation()
  const label = t('common.personalRecord')

  return (
    <img
      src={medalha}
      alt={label}
      title={label}
      className={['inline-block shrink-0 object-contain', className].join(' ')}
    />
  )
}

export function personalRecordRowClass(isRecord: boolean): string {
  return isRecord ? 'bg-accent/5 ring-1 ring-inset ring-accent/25' : ''
}
