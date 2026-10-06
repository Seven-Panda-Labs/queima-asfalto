/**
 * Writes small FIT files for tests, so no real activity, with its owner's name and
 * device serial, has to be committed. Covers only what the reader handles.
 */

export type FitFieldSpec = {
  number: number
  /** FIT base type byte, e.g. 0x84 for uint16. */
  baseType: number
  bytes: number
}

export type FitDataSpec = {
  localNumber: number
  /** Values in field order; `null` writes the type's invalid value. */
  values: (number | null)[]
  /** Write a compressed timestamp header carrying this 5 bit offset instead. */
  compressedOffset?: number
}

export type FitDefinitionSpec = {
  localNumber: number
  globalNumber: number
  fields: FitFieldSpec[]
  bigEndian?: boolean
  /** Developer fields as byte counts; the reader must step over them. */
  developerFieldBytes?: number[]
}

export type FitRecordSpec = { define: FitDefinitionSpec } | { data: FitDataSpec }

const INVALID: Record<number, number> = {
  0x00: 0xff, 0x02: 0xff, 0x01: 0x7f, 0x83: 0x7fff, 0x84: 0xffff,
  0x85: 0x7fffffff, 0x86: 0xffffffff, 0x8b: 0, 0x8c: 0, 0x0a: 0,
}

/** Common base types. */
export const UINT8 = 0x02
export const UINT16 = 0x84
export const SINT32 = 0x85
export const UINT32 = 0x86
export const ENUM = 0x00

function writeValue(view: DataView, at: number, field: FitFieldSpec, value: number, le: boolean) {
  switch (field.baseType) {
    case 0x00:
    case 0x02:
    case 0x0a:
      view.setUint8(at, value)
      return
    case 0x01:
      view.setInt8(at, value)
      return
    case 0x83:
      view.setInt16(at, value, le)
      return
    case 0x84:
    case 0x8b:
      view.setUint16(at, value, le)
      return
    case 0x85:
      view.setInt32(at, value, le)
      return
    case 0x86:
    case 0x8c:
      view.setUint32(at, value, le)
      return
    default:
      throw new Error(`fixture cannot write base type ${field.baseType}`)
  }
}

export function buildFitFile(records: FitRecordSpec[]): Uint8Array {
  const definitions = new Map<number, FitDefinitionSpec>()
  const body: number[] = []

  for (const record of records) {
    if ('define' in record) {
      const def = record.define
      definitions.set(def.localNumber, def)
      const developer = def.developerFieldBytes ?? []
      body.push(0x40 | (developer.length > 0 ? 0x20 : 0) | def.localNumber)
      body.push(0, def.bigEndian ? 1 : 0, ...(def.bigEndian
        ? [def.globalNumber >> 8, def.globalNumber & 0xff]
        : [def.globalNumber & 0xff, def.globalNumber >> 8]))
      body.push(def.fields.length)
      for (const field of def.fields) body.push(field.number, field.bytes, field.baseType)
      if (developer.length > 0) {
        body.push(developer.length)
        developer.forEach((bytes, index) => body.push(index, bytes, 0))
      }
      continue
    }

    const data = record.data
    const def = definitions.get(data.localNumber)
    if (!def) throw new Error(`no definition for local ${data.localNumber}`)
    body.push(
      data.compressedOffset === undefined
        ? data.localNumber
        : 0x80 | (data.localNumber << 5) | data.compressedOffset,
    )
    def.fields.forEach((field, index) => {
      const bytes = new Uint8Array(field.bytes)
      const value = data.values[index] ?? INVALID[field.baseType]
      writeValue(new DataView(bytes.buffer), 0, field, value, !def.bigEndian)
      body.push(...bytes)
    })
    for (const bytes of def.developerFieldBytes ?? []) body.push(...new Array(bytes).fill(0xab))
  }

  const header = new Uint8Array(12)
  const view = new DataView(header.buffer)
  header[0] = 12
  header[1] = 0x20
  view.setUint16(2, 2171, true)
  view.setUint32(4, body.length, true)
  header.set([0x2e, 0x46, 0x49, 0x54], 8)

  // The 2 byte CRC trailer is left as zeros: the reader does not check it.
  const file = new Uint8Array(12 + body.length + 2)
  file.set(header)
  file.set(body, 12)
  return file
}

/** FIT seconds for an ISO time. */
export function fitSeconds(iso: string): number {
  return Date.parse(iso) / 1000 - 631_065_600
}

/** Degrees to FIT semicircles. */
export function semicircles(degrees: number): number {
  return Math.round((degrees * 2 ** 31) / 180)
}
