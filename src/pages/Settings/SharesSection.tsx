import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../contexts/ToastContext'
import { useShares } from '../../hooks/useShares'
import { hasAnyPermission } from '../../../shared/shares/permissions'
import { DEFAULT_SHARE_PERMISSIONS, type Share, type SharePermissions } from '../../types/Share'
import { SharePermissionsFields } from '../Shares/SharePermissionsFields'

const INVITE_DEFAULTS: SharePermissions = {
  ...DEFAULT_SHARE_PERMISSIONS,
  bucketList: 'write',
  events: 'read_no_results',
}

function ShareStatusBadge({ status }: { status: Share['status'] }) {
  const { t } = useTranslation()
  const classes =
    status === 'active'
      ? 'bg-success/15 text-success'
      : status === 'pending'
        ? 'bg-accent/15 text-accent'
        : 'bg-muted/20 text-muted'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {t(`shares.status.${status}`)}
    </span>
  )
}

function ShareCard({
  share,
  role,
  onAccept,
  onDecline,
  onRevoke,
  onEditPermissions,
  isEditingPermissions,
  editPermissions,
  onPermissionsChange,
  onSavePermissions,
  onCancelEditPermissions,
  savingPermissions,
}: {
  share: Share
  role: 'sent' | 'received'
  onAccept?: () => void
  onDecline?: () => void
  onRevoke?: () => void
  onEditPermissions?: () => void
  isEditingPermissions?: boolean
  editPermissions?: SharePermissions
  onPermissionsChange?: (next: SharePermissions) => void
  onSavePermissions?: () => void
  onCancelEditPermissions?: () => void
  savingPermissions?: boolean
}) {
  const { t } = useTranslation()
  const personLabel =
    role === 'sent'
      ? share.granteeDisplayName || share.granteeEmail
      : share.ownerDisplayName || share.ownerId
  const personEmail = role === 'sent' ? share.granteeEmail : share.ownerEmail

  const canEditPermissions =
    role === 'sent' && (share.status === 'active' || share.status === 'pending')

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{personLabel}</h3>
          {personEmail ? <p className="mt-1 text-sm text-muted">{personEmail}</p> : null}
        </div>
        <ShareStatusBadge status={share.status} />
      </div>

      {isEditingPermissions && editPermissions && onPermissionsChange ? (
        <div className="mt-4 space-y-4">
          <SharePermissionsFields value={editPermissions} onChange={onPermissionsChange} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSavePermissions}
              disabled={savingPermissions}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {savingPermissions ? t('common.saving') : t('shares.savePermissions')}
            </button>
            <button
              type="button"
              onClick={onCancelEditPermissions}
              disabled={savingPermissions}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t('shares.sections.bucketList')}</dt>
            <dd className="font-medium text-foreground">{t(`shares.permission.${share.permissions.bucketList}`)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('shares.sections.events')}</dt>
            <dd className="font-medium text-foreground">{t(`shares.permission.${share.permissions.events}`)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('shares.sections.goals')}</dt>
            <dd className="font-medium text-foreground">{t(`shares.permission.${share.permissions.goals}`)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t('shares.sections.performanceGoals')}</dt>
            <dd className="font-medium text-foreground">
              {t(`shares.permission.${share.permissions.performanceGoals}`)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {role === 'received' && share.status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              {t('shares.accept')}
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-background"
            >
              {t('shares.decline')}
            </button>
          </>
        ) : null}
        {canEditPermissions && !isEditingPermissions ? (
          <button
            type="button"
            onClick={onEditPermissions}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-background"
          >
            {t('shares.editPermissions')}
          </button>
        ) : null}
        {share.status !== 'revoked' ? (
          <button
            type="button"
            onClick={onRevoke}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-danger hover:bg-background"
          >
            {t('shares.revoke')}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function SharesSection() {
  const { t } = useTranslation()
  const toast = useToast()
  const {
    shares,
    loading,
    error,
    sendInvite,
    accept,
    decline,
    revoke,
    updatePermissions,
    pendingReceivedCount,
  } = useShares()
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<SharePermissions>(INVITE_DEFAULTS)
  const [inviting, setInviting] = useState(false)
  const [editingShareId, setEditingShareId] = useState<string | null>(null)
  const [editPermissions, setEditPermissions] = useState<SharePermissions>(DEFAULT_SHARE_PERMISSIONS)
  const [savingPermissions, setSavingPermissions] = useState(false)

  const activeReceived = useMemo(
    () => shares.received.filter((share) => share.status === 'active'),
    [shares.received],
  )
  const pendingReceived = useMemo(
    () => shares.received.filter((share) => share.status === 'pending'),
    [shares.received],
  )

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!hasAnyPermission(permissions)) {
      toast.error(t('shares.inviteNeedsPermission'))
      return
    }

    setInviting(true)
    try {
      await sendInvite(email, permissions)
      setEmail('')
      toast.success(t('shares.inviteSent'))
    } catch (inviteError) {
      toast.error(inviteError instanceof Error ? inviteError.message : t('shares.inviteError'))
    } finally {
      setInviting(false)
    }
  }

  async function runAction(_shareId: string, action: () => Promise<void>) {
    try {
      await action()
      toast.success(t('shares.actionSuccess'))
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : t('shares.actionError'))
    }
  }

  function startEditingPermissions(share: Share) {
    setEditingShareId(share.id)
    setEditPermissions({ ...share.permissions })
  }

  function cancelEditingPermissions() {
    setEditingShareId(null)
    setEditPermissions(DEFAULT_SHARE_PERMISSIONS)
  }

  async function handleSavePermissions(shareId: string) {
    if (!hasAnyPermission(editPermissions)) {
      toast.error(t('shares.inviteNeedsPermission'))
      return
    }

    setSavingPermissions(true)
    try {
      await updatePermissions(shareId, editPermissions)
      setEditingShareId(null)
      toast.success(t('shares.permissionsUpdated'))
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t('shares.actionError'))
    } finally {
      setSavingPermissions(false)
    }
  }

  function shareCardEditProps(share: Share) {
    const isEditing = editingShareId === share.id
    return {
      isEditingPermissions: isEditing,
      editPermissions: isEditing ? editPermissions : undefined,
      onPermissionsChange: isEditing ? setEditPermissions : undefined,
      onEditPermissions: () => startEditingPermissions(share),
      onCancelEditPermissions: cancelEditingPermissions,
      onSavePermissions: () => void handleSavePermissions(share.id),
      savingPermissions: isEditing && savingPermissions,
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-muted">{t('shares.subtitle')}</p>

      {pendingReceivedCount > 0 ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t('shares.pendingBanner', { count: pendingReceivedCount })}
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('shares.inviteTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{t('shares.inviteSubtitle')}</p>
        <form className="mt-4 space-y-4" onSubmit={(event) => void handleInvite(event)}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-foreground">{t('shares.inviteEmail')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
              placeholder={t('shares.inviteEmailPlaceholder')}
            />
          </label>
          <SharePermissionsFields value={permissions} onChange={setPermissions} />
          <button
            type="submit"
            disabled={inviting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {inviting ? t('common.saving') : t('shares.sendInvite')}
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">{t('common.loading')}</p> : null}

      {pendingReceived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('shares.receivedPending')}</h2>
          {pendingReceived.map((share) => (
            <ShareCard
              key={share.id}
              share={share}
              role="received"
              onAccept={() => void runAction(share.id, () => accept(share.id))}
              onDecline={() => void runAction(share.id, () => decline(share.id))}
              onRevoke={() => void runAction(share.id, () => revoke(share.id))}
            />
          ))}
        </section>
      ) : null}

      {activeReceived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('shares.receivedActive')}</h2>
          {activeReceived.map((share) => (
            <ShareCard
              key={share.id}
              share={share}
              role="received"
              onRevoke={() => void runAction(share.id, () => revoke(share.id))}
            />
          ))}
        </section>
      ) : null}

      {shares.sent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('shares.sent')}</h2>
          {shares.sent.map((share) => (
            <ShareCard
              key={share.id}
              share={share}
              role="sent"
              {...shareCardEditProps(share)}
              onRevoke={() => void runAction(share.id, () => revoke(share.id))}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}
