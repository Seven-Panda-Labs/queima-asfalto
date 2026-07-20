import type { BucketListItem } from '../types/BucketListItem'
import { eventHasCoordinates } from '../services/eventGeocoding'

export function bucketListItemsWithCoordinates(items: BucketListItem[]): BucketListItem[] {
  return items.filter(eventHasCoordinates)
}

export function bucketListItemsWithoutCoordinates(items: BucketListItem[]): BucketListItem[] {
  return items.filter((item) => !eventHasCoordinates(item) && item.location.trim())
}
