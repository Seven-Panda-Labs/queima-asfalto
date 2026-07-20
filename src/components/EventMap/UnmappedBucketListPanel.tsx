import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { BucketListItem } from '../../types/BucketListItem'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatTargetMonth } from '../../utils/targetMonth'

type UnmappedBucketListPanelProps = {
  items: BucketListItem[]
}

export function UnmappedBucketListPanel({ items }: UnmappedBucketListPanelProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  return (
    <aside className="w-full rounded-lg border border-border bg-surface p-4 lg:max-w-md">
      <h3 className="text-sm font-semibold text-foreground">{t('bucketList.unmappedTitle')}</h3>
      <p className="mt-1 text-xs text-muted">{t('bucketList.unmappedHint')}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-sm font-semibold text-foreground">
              {item.emoji ? `${item.emoji} ` : ''}
              {item.name}
            </p>
            <p className="text-xs text-muted">
              {item.disciplines.map((d) => formatEventTypeLabel(d)).join(', ')} ·{' '}
              {item.location || t('common.dash')}
              {item.targetMonth ? ` · ${formatTargetMonth(item.targetMonth)}` : ''}
            </p>
            <Link
              to={`/bucket-list/${item.id}/editar`}
              className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
            >
              {t('eventMap.editLocation')}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
