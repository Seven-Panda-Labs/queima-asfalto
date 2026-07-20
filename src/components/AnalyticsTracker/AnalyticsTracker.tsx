import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../../services/analytics'

export function AnalyticsTracker() {
  const location = useLocation()
  const isFirstPageView = useRef(true)

  useEffect(() => {
    void initAnalytics()
  }, [])

  useEffect(() => {
    const path = location.pathname + location.search

    if (isFirstPageView.current) {
      isFirstPageView.current = false
      return
    }

    void trackPageView(path)
  }, [location])

  return null
}
