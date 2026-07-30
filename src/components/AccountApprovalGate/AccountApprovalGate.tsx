import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isAccountApprovalEnabled } from '../../config/accountApproval'
import { useAccountStatus } from '../../hooks/useAccountStatus'
import { PendingApproval } from '../../pages/AccountApproval/PendingApproval'
import { RejectedAccount } from '../../pages/AccountApproval/RejectedAccount'

export function AccountApprovalGate() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { loading, status, canAccessApp } = useAccountStatus(user?.uid)

  if (!isAccountApprovalEnabled()) {
    return <Outlet />
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
            aria-hidden
          />
          <p className="text-muted">{t('common.loading')}</p>
        </div>
      </main>
    )
  }

  if (status === 'pending') {
    return <PendingApproval />
  }

  if (status === 'rejected') {
    return <RejectedAccount />
  }

  if (!canAccessApp) {
    return <PendingApproval />
  }

  return <Outlet />
}
