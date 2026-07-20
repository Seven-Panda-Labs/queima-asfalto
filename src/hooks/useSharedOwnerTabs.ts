import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  hasBucketListAccess,
  hasEventsAccess,
  hasSharedResultsAccess,
  hasSectionReadAccess,
} from '../../shared/shares/permissions'
import type { SharePermissions } from '../types/Share'
import { useShares } from './useShares'

export type SharedOwnerSection = 'bucketList' | 'events' | 'goals' | 'results'

export type SharedOwnerEntry = {
  ownerId: string
  label: string
  permissions: SharePermissions
}

function hasGoalsPageAccess(permissions: SharePermissions): boolean {
  return (
    hasSectionReadAccess(permissions.goals) ||
    hasSectionReadAccess(permissions.performanceGoals)
  )
}

function hasSectionAccess(permissions: SharePermissions, section: SharedOwnerSection): boolean {
  switch (section) {
    case 'bucketList':
      return hasBucketListAccess(permissions.bucketList)
    case 'events':
      return hasEventsAccess(permissions.events)
    case 'goals':
      return hasGoalsPageAccess(permissions)
    case 'results':
      return hasSharedResultsAccess(permissions.events)
  }
}

export function useSharedOwnerTabs(section: SharedOwnerSection, mineTabLabelKey: string) {
  const { t } = useTranslation()
  const { shares } = useShares()
  const [searchParams, setSearchParams] = useSearchParams()

  const sharedOwners = useMemo<SharedOwnerEntry[]>(
    () =>
      shares.received
        .filter(
          (share) =>
            share.status === 'active' && hasSectionAccess(share.permissions, section),
        )
        .map((share) => ({
          ownerId: share.ownerId,
          label: share.ownerDisplayName?.trim() || share.ownerId,
          permissions: share.permissions,
        })),
    [shares.received, section],
  )

  const tabs = useMemo(() => {
    if (sharedOwners.length === 0) return []
    return [
      { ownerId: null, label: t(mineTabLabelKey) },
      ...sharedOwners.map((owner) => ({ ownerId: owner.ownerId, label: owner.label })),
    ]
  }, [sharedOwners, t, mineTabLabelKey])

  const requestedOwnerId = searchParams.get('owner')
  const activeOwnerId =
    requestedOwnerId && sharedOwners.some((owner) => owner.ownerId === requestedOwnerId)
      ? requestedOwnerId
      : null

  useEffect(() => {
    if (requestedOwnerId && !sharedOwners.some((owner) => owner.ownerId === requestedOwnerId)) {
      const next = new URLSearchParams(searchParams)
      next.delete('owner')
      setSearchParams(next, { replace: true })
    }
  }, [requestedOwnerId, sharedOwners, searchParams, setSearchParams])

  function setActiveOwnerId(ownerId: string | null) {
    const next = new URLSearchParams(searchParams)
    if (ownerId) {
      next.set('owner', ownerId)
    } else {
      next.delete('owner')
    }
    setSearchParams(next, { replace: true })
  }

  const activeOwner = sharedOwners.find((owner) => owner.ownerId === activeOwnerId)

  return {
    sharedOwners,
    tabs,
    activeOwnerId,
    activeOwner,
    isSharedView: activeOwnerId !== null,
    setActiveOwnerId,
  }
}
