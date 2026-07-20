import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFound() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <h1 className="font-display text-4xl tracking-wide text-primary">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.message')}</p>
      <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
        {t('notFound.backLogin')}
      </Link>
    </main>
  )
}
