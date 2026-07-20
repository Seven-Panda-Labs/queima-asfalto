import i18n from '../i18n'
import type { BucketListItemCreate } from '../types/BucketListItem'
import type { EventType } from '../types/Event'
import { EVENT_TYPES } from '../types/Event'

const VALID_EVENT_TYPES: EventType[] = [...EVENT_TYPES]
const URL_PATTERN = /^https?:\/\/.+/i

export type BucketListFieldErrors = Record<string, string>

export function validateBucketListItem(
  data: BucketListItemCreate,
): { valid: boolean; errors: BucketListFieldErrors } {
  const errors: BucketListFieldErrors = {}

  if (!data.name.trim()) {
    errors.name = i18n.t('validation.nameRequired')
  }

  if (!data.location.trim()) {
    errors.location = i18n.t('validation.locationRequired')
  }

  if (!Number.isFinite(data.realDistance) || data.realDistance <= 0) {
    errors.realDistance = i18n.t('validation.distancePositive')
  }

  const uniqueDisciplines = [...new Set(data.disciplines)]
  if (
    uniqueDisciplines.length === 0 ||
    !uniqueDisciplines.every((discipline) => VALID_EVENT_TYPES.includes(discipline))
  ) {
    errors.disciplines = i18n.t('validation.disciplinesRequired')
  }

  if (data.link?.trim() && !URL_PATTERN.test(data.link.trim())) {
    errors.link = i18n.t('validation.invalidLink')
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
