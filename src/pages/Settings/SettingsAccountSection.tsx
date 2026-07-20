import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export function SettingsAccountSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      toast.error(t('settings.signOutError'))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-foreground">{t('settings.account')}</h2>
      {user ? (
        <p className="mt-2 text-sm text-muted">
          {t('settings.signedInAs')}{' '}
          <span className="font-semibold text-foreground">{user.email}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="mt-4 text-sm font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
      >
        {signingOut ? t('settings.signingOut') : t('settings.signOut')}
      </button>
    </section>
  )
}
