import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TABS = [
  { to: '/admin', key: 'admin.tabUsers', end: true },
  { to: '/admin/catalogo', key: 'admin.tabCatalog', end: false },
] as const

export function AdminTabs() {
  const { t } = useTranslation()

  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label={t('admin.tabsLabel')}>
      {TABS.map(({ to, key, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'rounded-full px-3 py-1 text-sm font-semibold transition-colors',
              isActive ? 'bg-primary text-white' : 'text-muted ring-1 ring-border hover:text-foreground',
            ].join(' ')
          }
        >
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
