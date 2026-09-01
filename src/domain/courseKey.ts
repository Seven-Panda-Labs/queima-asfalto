/**
 * A key that groups the same race however its name was typed that year.
 *
 * The words are sorted, so "Parkrun Hasenheide" and "Hasenheide Parkrun" land on
 * the same key. Casing, spacing, punctuation and accents are flattened for the
 * same reason: the name is typed by hand every time.
 *
 * Four digit years are dropped, so "Hasenheide Parkrun 2023" joins the rest.
 * Other numbers stay: "S 25 Berlin" without its 25 is a different race.
 *
 * Deliberately not fuzzy. Edit distance would put "Meia Maratona de Lisboa" with
 * "Maratona de Lisboa", and a rule nobody can predict is worse than one that
 * occasionally asks you to fix a name.
 */
export function courseKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !/^(19|20)\d{2}$/.test(token))
    .sort()
    .join(' ')
}
