/**
 * The codes live in `shared/` because the harvest needs them too: a discovered
 * race is filed under a preset distance inside a Cloud Function, where nothing
 * from `src/` is available. This re-export keeps the client's import path.
 */
export * from '../../shared/domain/eventCodes.js'
