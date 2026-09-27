import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
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
import { useAuth } from '../../contexts/AuthContext'
import { useIsAdmin } from '../../hooks/useIsAdmin'

const REPO_URL = 'https://github.com/Seven-Panda-Labs/queima-asfalto'

const navItems = [
  { to: '/', key: 'nav.dashboard', end: true, badge: false },
  { to: '/eventos', key: 'nav.events', end: false, badge: false },
  { to: '/analise', key: 'nav.results', end: false, badge: false },
  { to: '/objetivos', key: 'nav.goals', end: false, badge: false },
  { to: '/planeamento', key: 'nav.planning', end: false, badge: false },
  { to: '/ferramentas', key: 'nav.tools', end: false, badge: false },
  { to: '/definicoes', key: 'nav.settings', end: false, badge: true },
] as const

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}

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
  const { user } = useAuth()
  const { isAdmin } = useIsAdmin(user?.uid)
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeItem = navItems.find(({ to, end }) => matchPath({ path: to, end }, pathname))
  const activeKey = activeItem?.key ?? (matchPath({ path: '/admin', end: false }, pathname) ? 'nav.admin' : null)

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
        {/* Below sm the links fold behind one button: seven of them wrapped into three rows. */}
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:py-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMenuOpen(false)
          }}
        >
          <Logo linkTo="/" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
          <div className="ml-auto flex items-center gap-4">
            <SyncIndicator />
            <button
              type="button"
              className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-background sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {activeKey ? t(activeKey) : null}
              <span className="sr-only">{t('nav.menu')}</span>
              <MenuIcon open={menuOpen} />
              {!menuOpen && pendingReceivedCount > 0 ? (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
              ) : null}
            </button>
          </div>
          <div className={`${menuOpen ? 'flex' : 'hidden'} basis-full sm:flex sm:basis-auto`}>
            <nav
              id="main-nav"
              className="flex w-full flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2"
              aria-label={t('nav.main')}
              onClick={() => setMenuOpen(false)}
            >
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
              {isAdmin ? (
                <NavLink to="/admin" className={navLinkClass}>
                  {t('nav.admin')}
                </NavLink>
              ) : null}
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
        <p className="mt-1 text-xs">
          {t('footer.studioCreditPrefix')}{' '}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            {t('footer.studioName')}
          </a>
        </p>
      </footer>
    </div>
  )
}
