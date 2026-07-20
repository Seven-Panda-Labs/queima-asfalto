import { useFirestoreSync } from '../../hooks/useFirestoreSync'

export function SyncIndicator() {
  const status = useFirestoreSync()

  if (status === 'synced') return null

  if (status === 'offline') {
    return (
      <span className="text-xs font-semibold text-muted" title="Offline">
        Offline
      </span>
    )
  }

  return (
    <span className="text-xs font-semibold text-accent" role="status">
      ⏳ A sincronizar...
    </span>
  )
}
