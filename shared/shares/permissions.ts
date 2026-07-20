import type { EventsPermission, SectionPermission, SharePermissions } from './types.js'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hasBucketListAccess(permission: SectionPermission): boolean {
  return permission === 'read' || permission === 'write'
}

export function canWriteBucketList(permission: SectionPermission): boolean {
  return permission === 'write'
}

export function hasEventsAccess(permission: EventsPermission): boolean {
  return permission !== 'none'
}

export function hasSharedResultsAccess(permission: EventsPermission): boolean {
  return permission === 'read' || permission === 'write'
}

export function hasSectionReadAccess(permission: SectionPermission): boolean {
  return permission === 'read' || permission === 'write'
}

export function parseSharePermissions(value: unknown): SharePermissions {
  if (!value || typeof value !== 'object') {
    return {
      bucketList: 'none',
      events: 'none',
      goals: 'none',
      performanceGoals: 'none',
      media: 'none',
    }
  }

  const data = value as Record<string, unknown>
  return {
    bucketList: parseSectionPermission(data.bucketList),
    events: parseEventsPermission(data.events),
    goals: parseSectionPermission(data.goals),
    performanceGoals: parseSectionPermission(data.performanceGoals),
    media: data.media === 'read' ? 'read' : 'none',
  }
}

function parseSectionPermission(value: unknown): SectionPermission {
  if (value === 'read' || value === 'write') return value
  return 'none'
}

function parseEventsPermission(value: unknown): EventsPermission {
  if (value === 'read' || value === 'read_no_results' || value === 'write') return value
  return 'none'
}

export function hasAnyPermission(permissions: SharePermissions): boolean {
  return (
    hasBucketListAccess(permissions.bucketList) ||
    hasEventsAccess(permissions.events) ||
    hasSectionReadAccess(permissions.goals) ||
    hasSectionReadAccess(permissions.performanceGoals) ||
    permissions.media === 'read'
  )
}
