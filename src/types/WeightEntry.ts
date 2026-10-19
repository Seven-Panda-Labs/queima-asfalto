/** A day in the weight log. Stands alone: nothing else in the app points to it or reads it. */
export type WeightEntry = {
  id: string
  userId: string
  /** ISO day, `YYYY-MM-DD`. A day, not an instant, so a timezone never moves it. */
  date: string
  /** A day may hold a weight, a note, or both; never neither. */
  weightKg?: number
  note?: string
  createdAt: Date
  updatedAt: Date
}

export type WeightDay = Pick<WeightEntry, 'weightKg' | 'note'>
