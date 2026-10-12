import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { segmentedGroupClass, segmentedItemClass } from '../../components/ViewSwitcher'

const TABS = [
  { to: '/admin', key: 'admin.tabUsers', end: true },
  { to: '/admin/catalogo', key: 'admin.tabCatalog', end: false },
  { to: '/admin/manutencao', key: 'admin.tabMaintenance', end: false },
] as const

export function AdminTabs() {
  const { t } = useTranslation()

  return (
    <nav className={`mt-6 ${segmentedGroupClass}`} aria-label={t('admin.tabsLabel')}>
      {TABS.map(({ to, key, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => segmentedItemClass(isActive)}>
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
