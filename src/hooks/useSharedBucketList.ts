import { useCallback, useEffect, useState } from 'react'
import i18n from '../i18n'
import type { BucketListItem, BucketListItemCreate } from '../types/BucketListItem'
import {
  createSharedBucketListItem,
  deleteSharedBucketListItem,
  fetchSharedSnapshot,
  updateSharedBucketListItem,
} from '../services/shares'
import { getSharedBucketListCache, setSharedBucketListCache } from '../utils/sharedDataCache'

export function useSharedBucketList(ownerId: string | null) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [ownerDisplayName, setOwnerDisplayName] = useState('')
  const [canWrite, setCanWrite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyCache = useCallback((owner: string) => {
    const cached = getSharedBucketListCache(owner)
    if (!cached) return false
    setItems(cached.items)
    setOwnerDisplayName(cached.ownerDisplayName)
    setCanWrite(cached.canWrite)
    return true
  }, [])

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setItems([])
      setOwnerDisplayName('')
      setCanWrite(false)
      setLoading(false)
      return
    }

    const hasCache = applyCache(ownerId)
    if (!hasCache) setLoading(true)
    setError(null)

    try {
      const snapshot = await fetchSharedSnapshot(ownerId, ['bucketList'])
      const entry = {
        items: snapshot.bucketList,
        ownerDisplayName: snapshot.ownerDisplayName,
        canWrite: snapshot.permissions.bucketList === 'write',
      }
      setSharedBucketListCache(ownerId, entry)
      setItems(entry.items)
      setOwnerDisplayName(entry.ownerDisplayName)
      setCanWrite(entry.canWrite)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : i18n.t('shares.loadError'))
      if (!hasCache) setItems([])
    } finally {
      setLoading(false)
    }
  }, [ownerId, applyCache])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addItem = useCallback(
    async (data: BucketListItemCreate) => {
      if (!ownerId) throw new Error(i18n.t('errors.notAuthenticated'))
      await createSharedBucketListItem(ownerId, data)
      await refresh()
    },
    [ownerId, refresh],
  )

  const editItem = useCallback(
    async (itemId: string, data: Partial<BucketListItemCreate>) => {
      if (!ownerId) throw new Error(i18n.t('errors.notAuthenticated'))
      await updateSharedBucketListItem(ownerId, itemId, data)
      await refresh()
    },
    [ownerId, refresh],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!ownerId) throw new Error(i18n.t('errors.notAuthenticated'))
      await deleteSharedBucketListItem(ownerId, itemId)
      await refresh()
    },
    [ownerId, refresh],
  )

  return {
    items,
    ownerDisplayName,
    canWrite,
    loading,
    error,
    refresh,
    addItem,
    editItem,
    removeItem,
  }
}
