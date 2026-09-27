/** One weigh-in. Stands alone: nothing else in the app points to it or reads it. */
export type WeightEntry = {
  id: string
  userId: string
  /** ISO day, `YYYY-MM-DD`. A day, not an instant, so a timezone never moves it. */
  date: string
  weightKg: number
  createdAt: Date
  updatedAt: Date
}
