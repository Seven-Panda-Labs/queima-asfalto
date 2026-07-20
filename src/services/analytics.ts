import type { Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'

type AnalyticsModule = {
  getAnalytics: (app: FirebaseApp) => Analytics
  isSupported: () => Promise<boolean>
  logEvent: (
    analyticsInstance: Analytics,
    eventName: string,
    eventParams?: Record<string, unknown>,
  ) => void
  app: FirebaseApp
}

let analytics: Analytics | null = null
let initPromise: Promise<Analytics | null> | null = null
let analyticsModule: AnalyticsModule | null = null

async function loadAnalyticsModule(): Promise<AnalyticsModule> {
  if (analyticsModule) return analyticsModule

  const [{ getAnalytics, isSupported, logEvent }, { app }] = await Promise.all([
    import('firebase/analytics'),
    import('./firebase'),
  ])

  analyticsModule = { getAnalytics, isSupported, logEvent, app }
  return analyticsModule
}

export function initAnalytics(): Promise<Analytics | null> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (typeof window === 'undefined') return null

    const { getAnalytics, isSupported, app } = await loadAnalyticsModule()
    if (!(await isSupported())) return null

    analytics = getAnalytics(app)
    return analytics
  })()

  return initPromise
}

export async function trackPageView(path: string): Promise<void> {
  const instance = analytics ?? (await initAnalytics())
  if (!instance) return

  const { logEvent } = await loadAnalyticsModule()
  logEvent(instance, 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  })
}
