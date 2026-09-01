/**
 * Where the catalog lives now.
 *
 * One document per race, not one document holding all of them: entries are edited
 * one at a time in the admin area, and a read-modify-write of a single big
 * document would lose whichever edit landed second. The parkrun catalog made the
 * opposite choice for the opposite reason, thousands of entries nobody edits.
 */
export const RACE_CATALOG_COLLECTION = 'raceCatalog'
