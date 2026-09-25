import { useTranslation } from 'react-i18next'

type UnmappedBucketListPanelProps = {
  items: { id: string; name: string; location: string }[]
}

/**
 * The wishes the map cannot place.
 *
 * No link to fix it: the place belongs to the race and to the catalog entry
 * behind it, not to the wish, and nothing on a wish's own page could correct
 * it. What this is for is saying plainly that the map is not the whole list.
 */
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
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
            <p className="text-xs text-muted">{item.location || t('common.dash')}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}
