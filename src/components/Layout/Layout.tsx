import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { I18nSync } from '../I18nSync/I18nSync'
import { usePushRegistration } from '../../hooks/usePushRegistration'
import { useReminders } from '../../hooks/useReminders'
import { useShares } from '../../hooks/useShares'
import { getPersistenceWarning } from '../../services/firebase'
import { Logo } from '../Logo/Logo'
import { GlobalEventTransitions } from '../GlobalEventTransitions/GlobalEventTransitions'
import { OfflineIndicator } from '../OfflineIndicator'
import { SyncIndicator } from '../SyncIndicator'
import { APP_VERSION } from '../../appVersion'
import { isPrivacyPolicyEnabled, privacyPolicyPath } from '../../config/privacyPolicy'
import { timingDisclaimerPath } from '../../config/timingDisclaimer'

const navItems = [
  { to: '/', key: 'nav.dashboard', end: true, badge: false },
  { to: '/eventos', key: 'nav.events', end: false, badge: false },
  { to: '/resultados', key: 'nav.results', end: false, badge: false },
  { to: '/objetivos', key: 'nav.goals', end: false, badge: false },
  { to: '/bucket-list', key: 'nav.bucketList', end: false, badge: false },
  { to: '/definicoes', key: 'nav.settings', end: false, badge: true },
] as const

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-background',
  ].join(' ')
}

export function Layout() {
  const { t } = useTranslation()
  const persistenceWarning = getPersistenceWarning()
  const { pendingReceivedCount } = useShares()
  const showPrivacyPolicy = isPrivacyPolicyEnabled()

  useReminders()
  usePushRegistration()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <I18nSync />
      <GlobalEventTransitions />
      <OfflineIndicator />
      {persistenceWarning ? (
        <p className="bg-background px-4 py-2 text-center text-xs text-muted">{persistenceWarning}</p>
      ) : null}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo linkTo="/" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SyncIndicator />
            <nav className="flex flex-wrap gap-2" aria-label={t('nav.main')}>
              {navItems.map(({ to, key, end, badge }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    {t(key)}
                    {badge && pendingReceivedCount > 0 ? (
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white"
                        aria-label={t('nav.pendingInvites', { count: pendingReceivedCount })}
                      >
                        {pendingReceivedCount}
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4 text-center text-sm text-muted">
        <p>
          {t('footer.appName')} ·{' '}
          <Link
            to="/novidades"
            className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
            aria-label={t('footer.viewChangelog', { version: APP_VERSION })}
          >
            v{APP_VERSION}
          </Link>
          {' '}
          ·{' '}
          <Link
            to={timingDisclaimerPath()}
            className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
          >
            {t('footer.timingDisclaimer')}
          </Link>
          {showPrivacyPolicy ? (
            <>
              {' '}
              ·{' '}
              <Link
                to={privacyPolicyPath()}
                className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                {t('footer.privacy')}
              </Link>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-xs">{t('footer.studioCredit')}</p>
      </footer>
    </div>
  )
}
