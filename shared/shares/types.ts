export type ShareStatus = 'pending' | 'active' | 'revoked'

export type SectionPermission = 'none' | 'read' | 'write'

export type EventsPermission = 'none' | 'read' | 'read_no_results' | 'write'

export type MediaPermission = 'none' | 'read'

export type SharePermissions = {
  bucketList: SectionPermission
  events: EventsPermission
  goals: SectionPermission
  performanceGoals: SectionPermission
  media: MediaPermission
}

export const DEFAULT_SHARE_PERMISSIONS: SharePermissions = {
  bucketList: 'none',
  events: 'none',
  goals: 'none',
  performanceGoals: 'none',
  media: 'none',
}

export type SharedDataSection = 'events' | 'bucketList' | 'goals' | 'performanceGoals'

export type Share = {
  id: string
  ownerId: string
  ownerDisplayName?: string
  ownerEmail?: string
  granteeId?: string
  granteeEmail: string
  granteeDisplayName?: string
  status: ShareStatus
  permissions: SharePermissions
  createdAt: Date
  updatedAt: Date
  revokedAt?: Date
}

export type ShareList = {
  sent: Share[]
  received: Share[]
}
