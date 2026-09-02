import { lazy, Suspense } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AnalyticsTracker } from './components/AnalyticsTracker/AnalyticsTracker'
import { Layout } from './components/Layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { AccountApprovalGate } from './components/AccountApprovalGate/AccountApprovalGate'
import { BucketList } from './pages/BucketList/BucketList'
import { BucketListForm } from './pages/BucketList/BucketListForm'
import { EntryForm } from './pages/BucketList/EntryForm'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Events } from './pages/Events/Events'
import { EventDetail } from './pages/Events/EventDetail'
import { EventForm } from './pages/Events/EventForm'
import { GoalForm } from './pages/Goals/GoalForm'
import { Goals } from './pages/Goals/Goals'
import { PerformanceGoalForm } from './pages/Goals/PerformanceGoalForm'
import { Login } from './pages/Login/Login'
import { NotFound } from './pages/NotFound/NotFound'
import { Results } from './pages/Results/Results'
import { AdminCatalog } from './pages/Admin/AdminCatalog'
import { AdminCatalogForm } from './pages/Admin/AdminCatalogForm'
import { AdminOnly } from './pages/Admin/AdminOnly'
import { AdminUsers } from './pages/Admin/AdminUsers'
import { Settings } from './pages/Settings/Settings'
import { ANALYSIS_PATH } from './utils/eventNavigation'

const Changelog = lazy(() =>
  import('./pages/Changelog/Changelog').then((module) => ({
    default: module.Changelog,
  })),
)

const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy/PrivacyPolicy').then((module) => ({
    default: module.PrivacyPolicy,
  })),
)

const TimingDisclaimer = lazy(() =>
  import('./pages/TimingDisclaimer/TimingDisclaimer').then((module) => ({
    default: module.TimingDisclaimer,
  })),
)

/** Keeps old bookmarks and `returnTo` links working, filters intact. */
function AnalysisRouteRedirect() {
  const { search } = useLocation()
  return <Navigate to={`${ANALYSIS_PATH}${search}`} replace />
}

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AccountApprovalGate />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="eventos" element={<Events />} />
            <Route path="eventos/novo" element={<EventForm />} />
            <Route path="eventos/:id/editar" element={<EventForm />} />
            <Route path="eventos/:id" element={<EventDetail />} />
            <Route path="bucket-list" element={<BucketList />} />
            <Route path="bucket-list/novo" element={<BucketListForm />} />
            <Route path="bucket-list/:id/editar" element={<BucketListForm />} />
            <Route path="bucket-list/:id/inscricao" element={<EntryForm />} />
            <Route path="objetivos" element={<Goals />} />
            <Route path="objetivos/novo" element={<GoalForm />} />
            <Route path="objetivos/performance/novo" element={<PerformanceGoalForm />} />
            <Route path="objetivos/performance/:id/editar" element={<PerformanceGoalForm />} />
            <Route path="objetivos/:id/editar" element={<GoalForm />} />
            <Route path="analise" element={<Results />} />
            <Route path="resultados" element={<AnalysisRouteRedirect />} />
            <Route path="definicoes" element={<Settings />} />
            <Route
              path="admin"
              element={
                <AdminOnly>
                  <AdminUsers />
                </AdminOnly>
              }
            />
            <Route
              path="admin/catalogo"
              element={
                <AdminOnly>
                  <AdminCatalog />
                </AdminOnly>
              }
            />
            <Route
              path="admin/catalogo/novo"
              element={
                <AdminOnly>
                  <AdminCatalogForm />
                </AdminOnly>
              }
            />
            <Route
              path="admin/catalogo/:id"
              element={
                <AdminOnly>
                  <AdminCatalogForm />
                </AdminOnly>
              }
            />
            <Route path="novidades" element={
              <Suspense fallback={null}>
                <Changelog />
              </Suspense>
            } />
            <Route path="aviso-resultados" element={
              <Suspense fallback={null}>
                <TimingDisclaimer />
              </Suspense>
            } />
            <Route
              path="privacidade"
              element={
                <Suspense fallback={null}>
                  <PrivacyPolicy />
                </Suspense>
              }
            />
            <Route path="partilhas" element={<Navigate to="/definicoes?tab=partilhas" replace />} />
          </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
