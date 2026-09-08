import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Every filtered and ordered query needs a composite index, and only production
 * says so.
 *
 * The emulator answers these queries happily without any index, so this class
 * of bug ships: `races` and `raceEntries` were queried for two releases before
 * anybody hit "The query requires an index" against the real database. A test
 * is the only thing that can see it before a deploy.
 *
 * The cheapest way to pass this test is to not need an index: a filter with no
 * order needs none, and a collection nobody paginates loses nothing by sorting
 * in memory. That is what those two queries do now.
 *
 * It reads the services with a regular expression, which is coarse. The floor
 * below is the guard: if the pattern stops matching what the code looks like,
 * the count drops and this fails instead of quietly checking nothing.
 */
const QUERY_FLOOR = 4

const COLLECTION_NAMES: Record<string, string> = {
  EVENTS_COLLECTION: 'events',
  BUCKET_LIST_COLLECTION: 'bucketListItems',
  RACE_ENTRIES_COLLECTION: 'raceEntries',
  RACES_COLLECTION: 'races',
  GOALS_COLLECTION: 'goals',
  PERFORMANCE_GOALS_COLLECTION: 'performanceGoals',
  RACE_CATALOG_COLLECTION: 'raceCatalog',
}

type Query = {
  file: string
  collection: string
  filters: string[]
  orders: { field: string; direction: string }[]
}

function collectQueries(): Query[] {
  const found: Query[] = []
  for (const file of readdirSync('src/services').filter((name) => name.endsWith('.ts'))) {
    if (file.endsWith('.test.ts')) continue
    const source = readFileSync(`src/services/${file}`, 'utf8')

    for (const match of source.matchAll(
      /query\(\s*collection\(db,\s*([A-Za-z_.'"]+)\s*\)([\s\S]*?)\n\s*\)/g,
    )) {
      const raw = match[1]!.replace(/['"]/g, '')
      const body = match[2]!
      const filters = [...body.matchAll(/where\('([^']+)'/g)].map((where) => where[1]!)
      const orders = [...body.matchAll(/orderBy\('([^']+)'(?:,\s*'([^']+)')?/g)].map((order) => ({
        field: order[1]!,
        direction: (order[2] ?? 'asc').toLowerCase(),
      }))
      if (filters.length === 0 || orders.length === 0) continue

      found.push({
        file,
        collection: COLLECTION_NAMES[raw] ?? raw,
        filters,
        orders,
      })
    }
  }
  return found
}

type DeclaredIndex = {
  collectionGroup: string
  fields: { fieldPath: string; order: string }[]
}

function declaredIndexes(): DeclaredIndex[] {
  return (JSON.parse(readFileSync('firestore.indexes.json', 'utf8')) as {
    indexes: DeclaredIndex[]
  }).indexes
}

describe('firestore indexes', () => {
  const queries = collectQueries()

  it('still recognises the queries in the services', () => {
    expect(queries.length).toBeGreaterThanOrEqual(QUERY_FLOOR)
  })

  it.each(queries)(
    'declares an index for $collection ($file)',
    ({ collection, filters, orders }) => {
      const wanted = [
        ...filters.map((field) => ({ fieldPath: field, order: 'ASCENDING' })),
        ...orders.map((order) => ({
          fieldPath: order.field,
          order: order.direction === 'desc' ? 'DESCENDING' : 'ASCENDING',
        })),
      ]

      const match = declaredIndexes().find(
        (index) =>
          index.collectionGroup === collection &&
          index.fields.length === wanted.length &&
          index.fields.every(
            (field, position) =>
              field.fieldPath === wanted[position]!.fieldPath &&
              field.order === wanted[position]!.order,
          ),
      )

      expect(
        match,
        `firestore.indexes.json has no index for ${collection} on ${wanted
          .map((field) => `${field.fieldPath} ${field.order}`)
          .join(', ')}`,
      ).toBeDefined()
    },
  )
})

/**
 * The discovery query builds its filters from what the runner asked for, so a
 * regular expression cannot enumerate its shapes. This asserts them from the
 * function's own contract instead: `searchRaceCatalog` orders by
 * `nextRaceDate` and adds `country` and one `disciplines` filter when it has
 * them, which is four shapes and three composite indexes.
 */
describe('the discovery query', () => {
  const SHAPES: { name: string; fields: { fieldPath: string; order?: string; arrayConfig?: string }[] }[] = [
    {
      name: 'country and date',
      fields: [
        { fieldPath: 'country', order: 'ASCENDING' },
        { fieldPath: 'nextRaceDate', order: 'ASCENDING' },
      ],
    },
    {
      name: 'discipline and date',
      fields: [
        { fieldPath: 'disciplines', arrayConfig: 'CONTAINS' },
        { fieldPath: 'nextRaceDate', order: 'ASCENDING' },
      ],
    },
    {
      name: 'country, discipline and date',
      fields: [
        { fieldPath: 'country', order: 'ASCENDING' },
        { fieldPath: 'disciplines', arrayConfig: 'CONTAINS' },
        { fieldPath: 'nextRaceDate', order: 'ASCENDING' },
      ],
    },
  ]

  it.each(SHAPES)('declares an index for $name', ({ fields }) => {
    const match = declaredIndexes().find(
      (index) =>
        index.collectionGroup === 'raceCatalog' &&
        index.fields.length === fields.length &&
        index.fields.every(
          (field, position) =>
            field.fieldPath === fields[position]!.fieldPath &&
            (field as { arrayConfig?: string }).arrayConfig === fields[position]!.arrayConfig &&
            field.order === fields[position]!.order,
        ),
    )
    expect(match, 'declare it in firestore.indexes.json').toBeDefined()
  })

  it('reads the date field the query orders by', () => {
    // If the query stops ordering by nextRaceDate, these indexes are wrong and
    // this test is checking nothing.
    const source = readFileSync('src/services/raceCatalog.ts', 'utf8')
    expect(source).toContain("orderBy('nextRaceDate')")
  })
})
