import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { matchPath, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useShares } from '../hooks/useShares'
import {
  hasBucketListAccess,
  hasEventsAccess,
  hasSharedResultsAccess,
  hasSectionReadAccess,
} from '../../shared/shares/permissions'
import type { SharePermissions } from '../types/Share'

export type SharedSection = 'bucketList' | 'events' | 'goals' | 'results'

export type SharedOwnerEntry = {
  ownerId: string
  label: string
  permissions: SharePermissions
}

const SECTIONS: SharedSection[] = ['events', 'results', 'goals', 'bucketList']

/** The list pages that can show somebody else's data, in menu order. */
export const SHARED_SECTION_PATHS: { path: string; section: SharedSection }[] = [
  { path: '/eventos', section: 'events' },
  { path: '/analise', section: 'results' },
  { path: '/objetivos', section: 'goals' },
  { path: '/planeamento', section: 'bucketList' },
]

function sectionForListPath(pathname: string): SharedSection | null {
  return (
    SHARED_SECTION_PATHS.find(({ path }) => matchPath({ path, end: true }, pathname))?.section ?? null
  )
}

export function isSharedListPath(pathname: string): boolean {
  return sectionForListPath(pathname) !== null
}

/** Where someone's data starts: the first section they share. */
export function sharedHomePath(owner: SharedOwnerEntry): string {
  return (
    SHARED_SECTION_PATHS.find(({ section }) => hasSectionAccess(owner.permissions, section))?.path ??
    '/'
  )
}

/**
 * A page belongs to the shared view when it is a list the person shares, or a
 * page opened from one (an event, a wish), which carries `?owner=`.
 */
function belongsToSharedView(pathname: string, urlOwnerId: string | null, owner: SharedOwnerEntry) {
  const section = sectionForListPath(pathname)
  if (section) return hasSectionAccess(owner.permissions, section)
  return urlOwnerId === owner.ownerId
}

const STORAGE_KEY = 'queima-asfalto.sharedViewOwner'

export function hasSectionAccess(permissions: SharePermissions, section: SharedSection): boolean {
  switch (section) {
    case 'bucketList':
      return hasBucketListAccess(permissions.bucketList)
    case 'events':
      return hasEventsAccess(permissions.events)
    case 'goals':
      return (
        hasSectionReadAccess(permissions.goals) ||
        hasSectionReadAccess(permissions.performanceGoals)
      )
    case 'results':
      return hasSharedResultsAccess(permissions.events)
  }
}

type SharedViewValue = {
  /** Everybody who shares at least one section with the signed-in user. */
  owners: SharedOwnerEntry[]
  /** Whose data the share-aware pages show; null means the user's own. */
  viewedOwner: SharedOwnerEntry | null
  setViewedOwnerId: (ownerId: string | null) => void
}

const SharedViewContext = createContext<SharedViewValue>({
  owners: [],
  viewedOwner: null,
  setViewedOwnerId: () => {},
})

function readStored(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(ownerId: string | null) {
  try {
    if (ownerId) sessionStorage.setItem(STORAGE_KEY, ownerId)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode: the choice just does not outlive the tab.
  }
}

/**
 * Whose data the app is showing, chosen once in the account menu instead of on
 * every page: a per-page switch looked like a view toggle and was forgotten on
 * the next page. `?owner=` still wins, so links into somebody's event work.
 *
 * The shared view is a mode with its own pages. Landing anywhere else (a typed
 * URL, a stale link) leaves it, so the app never shows the user's own data
 * under somebody else's initials.
 */
export function SharedViewProvider({ children }: { children: ReactNode }) {
  const { shares, refresh } = useShares()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlOwnerId = searchParams.get('owner')
  const [storedOwnerId, setStoredOwnerId] = useState<string | null>(readStored)

  // Only when the param changes: a param still in the URL must not undo a
  // choice just made in the account menu.
  useEffect(() => {
    if (urlOwnerId) {
      setStoredOwnerId(urlOwnerId)
      writeStored(urlOwnerId)
    }
  }, [urlOwnerId])

  // Each list page used to fetch shares on mount; keep that, so a share
  // accepted in Settings shows up without a reload.
  const onSharedListPath = isSharedListPath(pathname)
  useEffect(() => {
    if (onSharedListPath) void refresh()
  }, [onSharedListPath, pathname, refresh])

  const owners = useMemo<SharedOwnerEntry[]>(
    () =>
      shares.received
        .filter(
          (share) =>
            share.status === 'active' &&
            SECTIONS.some((section) => hasSectionAccess(share.permissions, section)),
        )
        .map((share) => ({
          ownerId: share.ownerId,
          label: share.ownerDisplayName?.trim() || share.ownerId,
          permissions: share.permissions,
        })),
    [shares.received],
  )

  const viewedOwner = owners.find((owner) => owner.ownerId === storedOwnerId) ?? null

  // Set while a choice made on an unrelated page is still navigating to the
  // person's first section, so that page does not count as leaving the mode.
  const pendingPick = useRef<string | null>(null)

  useEffect(() => {
    if (!viewedOwner) return
    if (belongsToSharedView(pathname, urlOwnerId, viewedOwner)) {
      pendingPick.current = null
      return
    }
    if (pendingPick.current === viewedOwner.ownerId) return
    setStoredOwnerId(null)
    writeStored(null)
  }, [pathname, urlOwnerId, viewedOwner])

  const value = useMemo<SharedViewValue>(
    () => ({
      owners,
      viewedOwner,
      setViewedOwnerId(ownerId) {
        setStoredOwnerId(ownerId)
        writeStored(ownerId)
        const owner = owners.find((entry) => entry.ownerId === ownerId)
        if (owner && !belongsToSharedView(pathname, null, owner)) {
          pendingPick.current = owner.ownerId
          navigate(sharedHomePath(owner))
          return
        }
        if (!searchParams.has('owner')) return
        // One person's event or wish means nothing under another: back to the list.
        if (!isSharedListPath(pathname)) {
          navigate(`/${pathname.split('/')[1]}`)
          return
        }
        // A list keeps the param in its URL; it must follow the new choice.
        const next = new URLSearchParams(searchParams)
        if (ownerId) next.set('owner', ownerId)
        else next.delete('owner')
        setSearchParams(next, { replace: true })
      },
    }),
    [owners, viewedOwner, searchParams, setSearchParams, pathname, navigate],
  )

  return <SharedViewContext.Provider value={value}>{children}</SharedViewContext.Provider>
}

export function useSharedView(): SharedViewValue {
  return useContext(SharedViewContext)
}
