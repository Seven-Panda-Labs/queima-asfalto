/**
 * The parser lives in `shared/` so a Cloud Function can run the same code the
 * browser does. This keeps the app's imports where they were.
 */
export * from '../../../shared/activityTrack/index.js'
