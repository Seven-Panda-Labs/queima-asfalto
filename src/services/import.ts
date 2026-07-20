import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import i18n from '../i18n'
import { clearAllUserData } from './clearUserData'
import { listEvents } from './events'
import { listGoals } from './goals'
import { listBucketListItems } from './bucketList'
import type { BucketListItemCreate } from '../types/BucketListItem'
import type { EventCreate } from '../types/Event'
import type { GoalCreate } from '../types/Goal'

export type ImportResult = {
  eventsCreated: number
  eventsSkipped: number
  goalsCreated: number
  goalsSkipped: number
  bucketListCreated: number
  bucketListSkipped: number
  eventsDeleted: number
  goalsDeleted: number
  bucketListDeleted: number
  errors: string[]
}

type ImportOptions = {
  skipDuplicates?: boolean
  replaceExisting?: boolean
}

function startOfDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function eventDuplicateKey(event: Pick<EventCreate, 'name' | 'date' | 'location'>): string {
  return `${event.name.trim().toLowerCase()}|${startOfDay(event.date)}|${event.location.trim().toLowerCase()}`
}

function goalDuplicateKey(goal: GoalCreate): string {
  return `${goal.year}|${goal.eventType}`
}

export function bucketListDuplicateKey(
  item: Pick<BucketListItemCreate, 'name' | 'location'>,
): string {
  return `${item.name.trim().toLowerCase()}|${item.location.trim().toLowerCase()}`
}

const BATCH_SIZE = 500

export async function importData(
  userId: string,
  events: EventCreate[],
  goals: GoalCreate[],
  bucketListItems: BucketListItemCreate[] = [],
  options: ImportOptions = {},
): Promise<ImportResult> {
  const skipDuplicates = options.replaceExisting ? false : (options.skipDuplicates ?? true)
  const result: ImportResult = {
    eventsCreated: 0,
    eventsSkipped: 0,
    goalsCreated: 0,
    goalsSkipped: 0,
    bucketListCreated: 0,
    bucketListSkipped: 0,
    eventsDeleted: 0,
    goalsDeleted: 0,
    bucketListDeleted: 0,
    errors: [],
  }

  if (options.replaceExisting) {
    try {
      const cleared = await clearAllUserData(userId)
      result.eventsDeleted = cleared.eventsDeleted
      result.goalsDeleted = cleared.goalsDeleted
      result.bucketListDeleted = cleared.bucketListDeleted
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : i18n.t('errors.importClear'),
      )
      return result
    }
  }

  let existingEventKeys = new Set<string>()
  let existingGoalKeys = new Set<string>()
  let existingBucketListKeys = new Set<string>()

  if (skipDuplicates) {
    const [existingEvents, existingGoals, existingBucketList] = await Promise.all([
      listEvents(userId),
      listGoals(userId),
      listBucketListItems(userId),
    ])
    existingEventKeys = new Set(existingEvents.map(eventDuplicateKey))
    existingGoalKeys = new Set(existingGoals.map(goalDuplicateKey))
    existingBucketListKeys = new Set(existingBucketList.map(bucketListDuplicateKey))
  }

  const eventsToCreate: EventCreate[] = []
  for (const event of events) {
    const key = eventDuplicateKey(event)
    if (skipDuplicates && existingEventKeys.has(key)) {
      result.eventsSkipped += 1
      continue
    }
    eventsToCreate.push(event)
    existingEventKeys.add(key)
  }

  const goalsToCreate: GoalCreate[] = []
  for (const goal of goals) {
    const key = goalDuplicateKey(goal)
    if (skipDuplicates && existingGoalKeys.has(key)) {
      result.goalsSkipped += 1
      continue
    }
    goalsToCreate.push(goal)
    existingGoalKeys.add(key)
  }

  const bucketListToCreate: BucketListItemCreate[] = []
  for (const item of bucketListItems) {
    const key = bucketListDuplicateKey(item)
    if (skipDuplicates && existingBucketListKeys.has(key)) {
      result.bucketListSkipped += 1
      continue
    }
    bucketListToCreate.push(item)
    existingBucketListKeys.add(key)
  }

  try {
    for (let index = 0; index < eventsToCreate.length; index += BATCH_SIZE) {
      const chunk = eventsToCreate.slice(index, index + BATCH_SIZE)
      const batch = writeBatch(db)

      for (const event of chunk) {
        const ref = doc(collection(db, 'events'))
        batch.set(ref, {
          userId,
          name: event.name,
          date: event.date,
          realDistance: event.realDistance,
          eventType: event.eventType,
          location: event.location,
          status: event.status,
          emoji: event.emoji ?? null,
          notes: event.notes ?? null,
          time: event.time ?? null,
          pace: event.pace ?? null,
          classification: event.classification ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
      result.eventsCreated += chunk.length
    }
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : i18n.t('errors.importEvents'),
    )
  }

  try {
    for (let index = 0; index < goalsToCreate.length; index += BATCH_SIZE) {
      const chunk = goalsToCreate.slice(index, index + BATCH_SIZE)
      const batch = writeBatch(db)

      for (const goal of chunk) {
        const ref = doc(collection(db, 'goals'))
        batch.set(ref, {
          userId,
          eventType: goal.eventType,
          targetCount: goal.targetCount,
          year: goal.year,
          emoji: goal.emoji ?? null,
          notes: goal.notes ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
      result.goalsCreated += chunk.length
    }
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : i18n.t('errors.importGoals'),
    )
  }

  try {
    for (let index = 0; index < bucketListToCreate.length; index += BATCH_SIZE) {
      const chunk = bucketListToCreate.slice(index, index + BATCH_SIZE)
      const batch = writeBatch(db)

      for (const item of chunk) {
        const ref = doc(collection(db, 'bucketListItems'))
        batch.set(ref, {
          userId,
          name: item.name,
          location: item.location,
          locationLat: item.locationLat ?? null,
          locationLng: item.locationLng ?? null,
          locationGeocodeQuery: item.locationGeocodeQuery ?? null,
          locationGeocodedAt:
            item.locationLat != null && item.locationLng != null ? serverTimestamp() : null,
          realDistance: item.realDistance,
          disciplines: item.disciplines,
          targetMonth: item.targetMonth ?? null,
          link: item.link ?? null,
          emoji: item.emoji ?? null,
          notes: item.notes ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
      result.bucketListCreated += chunk.length
    }
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : i18n.t('errors.importBucket'),
    )
  }

  return result
}
