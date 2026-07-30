import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

export function PendingApproval() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <img
          src="/queima-asfalto-logo.png"
          alt="Queima Asfalto"
          className="mx-auto w-full max-w-xs sm:max-w-sm"
        />
        <h1 className="mt-6 font-display text-2xl tracking-wide text-primary">
          {t('accountApproval.pendingTitle')}
        </h1>
        <p className="mt-4 text-muted">{t('accountApproval.pendingMessage')}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-8 w-full rounded-md border border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-muted/20"
        >
          {t('accountApproval.signOut')}
        </button>
      </div>
    </main>
  )
}
