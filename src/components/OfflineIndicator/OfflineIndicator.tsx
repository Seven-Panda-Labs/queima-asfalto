import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../contexts/ToastContext'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function OfflineIndicator() {
  const { t } = useTranslation()
  const isOnline = useOnlineStatus()
  const toast = useToast()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }

    if (wasOffline.current) {
      toast.success(t('offline.reconnected'))
      wasOffline.current = false
    }
  }, [isOnline, toast, t])

  if (isOnline) return null

  return (
    <div
      role="status"
      className="bg-accent px-4 py-2 text-center text-sm font-semibold text-white"
    >
      {t('offline.banner')}
    </div>
  )
}
