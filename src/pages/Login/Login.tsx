import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type LoginLocationState = {
  from?: { pathname: string }
}

export function Login() {
  const { t } = useTranslation()
  const { user, loading, signInWithGoogle, signInWithEmulatorDev, emulatorSignInAvailable } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo =
    (location.state as LoginLocationState | null)?.from?.pathname ?? '/'

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
      </main>
    )
  }

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSignIn() {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithGoogle()
      navigate(redirectTo, { replace: true })
    } catch {
      setError(t('errors.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmulatorSignIn() {
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmulatorDev()
      navigate(redirectTo, { replace: true })
    } catch {
      setError(t('errors.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <img
          src="/queima-asfalto-logo.png"
          alt="Queima Asfalto"
          className="mx-auto w-full max-w-xs sm:max-w-sm"
        />
        <h1 className="mt-6 font-display text-2xl tracking-wide text-primary">{t('login.title')}</h1>
        <p className="mt-4 text-muted">{t('login.subtitle')}</p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={submitting}
          className="mt-8 w-full rounded-md bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? t('common.loading') : t('login.google')}
        </button>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {emulatorSignInAvailable ? (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs text-muted">{t('login.emulatorHint')}</p>
            <button
              type="button"
              onClick={handleEmulatorSignIn}
              disabled={submitting}
              className="mt-3 w-full rounded-md border border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-muted/20 disabled:opacity-60"
            >
              {submitting ? t('common.loading') : t('login.emulator')}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  )
}
