/** A whole field's ranking, so generous: the B2Run Berlin sample is 1.7 MB. */
export const MAX_RESULTS_PDF_BYTES = 25 * 1024 * 1024

export const RESULTS_PDF_ACCEPT = '.pdf,application/pdf'

/**
 * A surname on its own matches plenty of people in a 14k field. Past this many
 * the list stops being a choice and starts being the table again.
 */
export const MAX_RESULTS_PDF_CANDIDATES = 12
