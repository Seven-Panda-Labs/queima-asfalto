import medalha from '../../../assets/medalha.png'

type PersonalRecordIndicatorProps = {
  className?: string
}

export function PersonalRecordIndicator({ className = 'h-4 w-4' }: PersonalRecordIndicatorProps) {
  return (
    <img
      src={medalha}
      alt=""
      title="Recorde pessoal"
      aria-label="Recorde pessoal"
      className={['inline-block shrink-0 object-contain', className].join(' ')}
    />
  )
}

export function personalRecordRowClass(isRecord: boolean): string {
  return isRecord ? 'bg-accent/5 ring-1 ring-inset ring-accent/25' : ''
}
