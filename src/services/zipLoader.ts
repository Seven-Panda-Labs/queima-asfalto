export type FflateModule = typeof import('fflate')

let fflatePromise: Promise<FflateModule> | null = null

/** Lazy-loads fflate so it stays out of the main bundle, as xlsxLoader does. */
export function loadFflate(): Promise<FflateModule> {
  fflatePromise ??= import('fflate')
  return fflatePromise
}
