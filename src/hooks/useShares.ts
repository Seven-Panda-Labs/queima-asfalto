import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { ShareList, SharePermissions } from '../types/Share'
import {
  acceptShare,
  declineShare,
  inviteShare,
  listShares,
  revokeShare,
  updateSharePermissions,
} from '../services/shares'

export function useShares() {
  const { user } = useAuth()
  const [shares, setShares] = useState<ShareList>({ sent: [], received: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setShares({ sent: [], received: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const next = await listShares()
      setShares(next)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : i18n.t('shares.loadError'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const sendInvite = useCallback(
    async (granteeEmail: string, permissions: SharePermissions) => {
      await inviteShare(granteeEmail, permissions)
      await refresh()
    },
    [refresh],
  )

  const accept = useCallback(
    async (shareId: string) => {
      await acceptShare(shareId)
      await refresh()
    },
    [refresh],
  )

  const decline = useCallback(
    async (shareId: string) => {
      await declineShare(shareId)
      await refresh()
    },
    [refresh],
  )

  const revoke = useCallback(
    async (shareId: string) => {
      await revokeShare(shareId)
      await refresh()
    },
    [refresh],
  )

  const updatePermissions = useCallback(
    async (shareId: string, permissions: SharePermissions) => {
      await updateSharePermissions(shareId, permissions)
      await refresh()
    },
    [refresh],
  )

  const pendingReceivedCount = shares.received.filter((share) => share.status === 'pending').length

  return {
    shares,
    loading,
    error,
    refresh,
    sendInvite,
    accept,
    decline,
    revoke,
    updatePermissions,
    pendingReceivedCount,
  }
}
