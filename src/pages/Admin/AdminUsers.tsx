import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { listUsersForAdmin, setAccountStatusForAdmin, type AdminUser } from '../../services/admin'
import { formatDatePt } from '../../utils/date'

type Busy = { uid: string; action: 'approved' | 'rejected' } | null

export function AdminUsers() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<Busy>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listUsersForAdmin()
      setUsers(result.users)
      setTruncated(result.truncated)
    } catch {
      setError(t('admin.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  async function handleStatus(target: AdminUser, status: 'approved' | 'rejected') {
    setBusy({ uid: target.uid, action: status })
    try {
      await setAccountStatusForAdmin(target.uid, status)
      setUsers((current) =>
        current.map((entry) =>
          entry.uid === target.uid ? { ...entry, accountStatus: status } : entry,
        ),
      )
      toast.success(t(status === 'approved' ? 'admin.approved' : 'admin.blocked'))
    } catch {
      toast.error(t('admin.actionError'))
    } finally {
      setBusy(null)
    }
  }

  // Pending first: it is the only row that is waiting on somebody.
  const ordered = [...users].sort((left, right) => {
    const weight = (status: AdminUser['accountStatus']) => (status === 'pending' ? 0 : 1)
    return weight(left.accountStatus) - weight(right.accountStatus)
  })

  return (
    <PageShell title={t('admin.usersTitle')}>
      <p className="mt-2 text-sm text-muted">{t('admin.usersSubtitle')}</p>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="mt-6 space-y-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-border/60" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('admin.columnAccount')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.columnStatus')}</th>
                <th className="px-4 py-3 font-semibold">{t('admin.columnSince')}</th>
                <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((entry) => {
                const isSelf = entry.uid === user?.uid
                const working = busy?.uid === entry.uid
                return (
                  <tr key={entry.uid} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">
                        {entry.name || t('admin.noName')}
                      </span>
                      <span className="block text-xs text-muted">{entry.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <AccountStatusBadge status={entry.accountStatus} />
                      {entry.admin ? (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-primary">
                          {t('admin.roleBadge')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.createdAt ? formatDatePt(new Date(entry.createdAt)) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-muted">{t('admin.self')}</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {entry.accountStatus !== 'approved' ? (
                            <button
                              type="button"
                              disabled={working}
                              onClick={() => void handleStatus(entry, 'approved')}
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                            >
                              {t('admin.approve')}
                            </button>
                          ) : null}
                          {entry.accountStatus !== 'rejected' ? (
                            <button
                              type="button"
                              disabled={working}
                              onClick={() => void handleStatus(entry, 'rejected')}
                              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-60"
                            >
                              {t('admin.block')}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {truncated ? <p className="mt-3 text-xs text-muted">{t('admin.truncated')}</p> : null}

      <p className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted">
        {t('admin.blockKeepsData')}
      </p>

      <p className="mt-2 text-xs text-muted">{t('admin.roleIsConsoleOnly')}</p>
    </PageShell>
  )
}

/**
 * Account statuses, in their own words.
 *
 * Not `StatusBadge`: that one speaks about races, so an account came out reading
 * "Planned" and "Cancelled", which is not what pending and blocked mean.
 */
const STATUS_STYLES: Record<AdminUser['accountStatus'], string> = {
  pending: 'bg-warning-bg text-warning-fg',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

function AccountStatusBadge({ status }: { status: AdminUser['accountStatus'] }) {
  const { t } = useTranslation()
  const labels: Record<AdminUser['accountStatus'], string> = {
    pending: t('admin.statusPending'),
    approved: t('admin.statusApproved'),
    rejected: t('admin.statusBlocked'),
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}
    >
      {labels[status]}
    </span>
  )
}
