import { useCallback, useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { BucketListItem, BucketListItemCreate } from '../types/BucketListItem'
import {
  bucketListCollectionQuery,
  createBucketListItem,
  deleteBucketListItem,
  docToBucketListItem,
  updateBucketListItem,
} from '../services/bucketList'

export function useBucketList() {
  const { user } = useAuth()
  const [items, setItems] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      bucketListCollectionQuery(user.uid),
      (snapshot) => {
        const nextItems = snapshot.docs.map((document) =>
          docToBucketListItem(document.id, document.data()),
        )
        setItems(nextItems)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const addItem = useCallback(
    async (data: BucketListItemCreate) => {
      if (!user) throw new Error(i18n.t('errors.notAuthenticated'))
      return createBucketListItem(user.uid, data)
    },
    [user],
  )

  const editItem = useCallback(
    async (itemId: string, data: Partial<Omit<BucketListItem, 'id' | 'userId' | 'createdAt'>>) => {
      await updateBucketListItem(itemId, data)
    },
    [],
  )

  const removeItem = useCallback(async (itemId: string) => {
    await deleteBucketListItem(itemId)
  }, [])

  return {
    items,
    loading,
    error,
    addItem,
    editItem,
    removeItem,
  }
}
