import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSharedView } from '../../contexts/SharedViewContext'
import { useToast } from '../../contexts/ToastContext'
import { initials } from '../../utils/initials'

function Avatar({ label, shared, size }: { label: string; shared: boolean; size: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'md' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs',
        shared ? 'bg-accent text-white' : 'bg-primary/15 text-primary',
      ].join(' ')}
    >
      {initials(label)}
    </span>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ms-auto h-4 w-4 text-primary"
      aria-hidden
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  )
}

/**
 * The account, and whose data the app shows. Own data is the normal state, so
 * the button is just the user's initials; it turns into the other person's
 * initials, in the accent colour, while the banner below says whose they are.
 */
export function AccountMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, signOut } = useAuth()
  const { owners, viewedOwner, setViewedOwnerId } = useSharedView()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (!user) return null

  const ownLabel = user.displayName?.trim() || user.email || ''

  function choose(ownerId: string | null) {
    setViewedOwnerId(ownerId)
    setOpen(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      toast.error(t('account.signOutError'))
    } finally {
      setSigningOut(false)
    }
  }

  const itemClass =
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm font-semibold text-foreground transition-colors hover:bg-background'

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={
          viewedOwner ? t('shares.viewingBanner', { name: viewedOwner.label }) : t('account.menu')
        }
        onClick={() => setOpen((value) => !value)}
        className="flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Avatar label={viewedOwner?.label ?? ownLabel} shared={viewedOwner !== null} size="md" />
      </button>

      {open ? (
        <div
          id="account-menu"
          className="absolute end-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-muted">{t('account.signedInAs')}</p>
            <p className="truncate text-sm font-semibold text-foreground">{user.email}</p>
          </div>

          {owners.length > 0 ? (
            <div role="group" aria-label={t('shares.viewing.pickerLabel')} className="border-t border-border pt-1">
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {t('shares.viewing.pickerLabel')}
              </p>
              <button
                type="button"
                aria-pressed={viewedOwner === null}
                onClick={() => choose(null)}
                className={itemClass}
              >
                <Avatar label={ownLabel} shared={false} size="sm" />
                {t('shares.viewing.mine')}
                {viewedOwner === null ? <CheckIcon /> : null}
              </button>
              {owners.map((owner) => {
                const active = viewedOwner?.ownerId === owner.ownerId
                return (
                  <button
                    key={owner.ownerId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => choose(owner.ownerId)}
                    className={itemClass}
                  >
                    <Avatar label={owner.label} shared size="sm" />
                    <span className="truncate">{owner.label}</span>
                    {active ? <CheckIcon /> : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="mt-1 border-t border-border pt-1">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className={`${itemClass} disabled:opacity-50`}
            >
              {signingOut ? t('account.signingOut') : t('account.signOut')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
