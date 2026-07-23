export type XlsxModule = typeof import('xlsx')

let xlsxPromise: Promise<XlsxModule> | null = null

export function loadXlsx(): Promise<XlsxModule> {
  xlsxPromise ??= import('xlsx')
  return xlsxPromise
}
