export type EventMediaType = 'photo' | 'video'

export type EventMedia = {
  id: string
  eventId: string
  userId: string
  type: EventMediaType
  storagePath: string
  downloadUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds?: number
  createdAt: Date
}

export type EventMediaCreate = {
  userId: string
  type: EventMediaType
  storagePath: string
  downloadUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds?: number
}
