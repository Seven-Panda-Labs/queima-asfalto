import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { NotFound } from '../NotFound/NotFound'

/**
 * Renders the admin area, or a 404.
 *
 * Not a redirect and not a "forbidden" screen: to anyone who is not an operator,
 * the route simply does not exist. The real gate is `requireAdmin` in the
 * callables, which is what would stop a hand-written request.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { loading, isAdmin } = useIsAdmin(user?.uid)

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-border/60" aria-hidden />
  }

  return isAdmin ? <>{children}</> : <NotFound />
}
