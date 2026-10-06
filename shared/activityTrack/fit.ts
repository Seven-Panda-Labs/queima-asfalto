/**
 * The FIT container, down to the point where messages become numbered fields.
 *
 * FIT is binary and self describing: a definition message declares the fields,
 * sizes and byte order of every data message that follows under the same local
 * number, so reading the container needs no table of its own. Only the mapping
 * from field number to meaning does, and that lives in `parseFit.ts`.
 */

/** Seconds between the FIT epoch, 1989-12-31T00:00:00Z, and the Unix one. */
export const FIT_EPOCH_OFFSET_SECONDS = 631_065_600

/** Field 253 is the timestamp in every message that has one. */
export const FIT_TIMESTAMP_FIELD = 253

/** The header is 12 bytes, or 14 with a CRC of its own, and holds the `.FIT` signature. */
const MIN_HEADER_BYTES = 12
const HEADER_SIZES = [12, 14]
const SIGNATURE_OFFSET = 8
const SIGNATURE = [0x2e, 0x46, 0x49, 0x54] // ".FIT"

const DEFINITION_MESSAGE = 0x40
const DEVELOPER_FIELDS = 0x20
const COMPRESSED_TIMESTAMP = 0x80
const LOCAL_NUMBER_MASK = 0x0f

/** 5 bits of offset against the rolling timestamp, so it wraps every 32 seconds. */
const COMPRESSED_OFFSET_MASK = 0x1f
const COMPRESSED_OFFSET_PERIOD = 32

export type FitMessage = {
  globalNumber: number
  /** Field number to value. Fields the file marked invalid are absent. */
  fields: Map<number, number>
}

type FieldDefinition = { number: number; bytes: number; baseType: number; developer: boolean }

type BaseType = { bytes: number; read: (view: DataView, at: number, le: boolean) => number }

/**
 * Every base type reports an invalid value, which the file writes into a field it
 * has nothing for. Unsigned types use all ones, signed ones their maximum, and the
 * `z` variants zero.
 */
function baseTypeOf(encoded: number): BaseType | null {
  switch (encoded & 0x1f) {
    case 0x00: // enum
    case 0x02: // uint8
    case 0x0a: // uint8z
    case 0x0d: // byte
      return { bytes: 1, read: (view, at) => view.getUint8(at) }
    case 0x01: // sint8
      return { bytes: 1, read: (view, at) => view.getInt8(at) }
    case 0x03: // sint16
      return { bytes: 2, read: (view, at, le) => view.getInt16(at, le) }
    case 0x04: // uint16
    case 0x0b: // uint16z
      return { bytes: 2, read: (view, at, le) => view.getUint16(at, le) }
    case 0x05: // sint32
      return { bytes: 4, read: (view, at, le) => view.getInt32(at, le) }
    case 0x06: // uint32
    case 0x0c: // uint32z
      return { bytes: 4, read: (view, at, le) => view.getUint32(at, le) }
    case 0x07: // string
      return { bytes: 1, read: (view, at) => view.getUint8(at) }
    case 0x08: // float32
      return { bytes: 4, read: (view, at, le) => view.getFloat32(at, le) }
    case 0x09: // float64
      return { bytes: 8, read: (view, at, le) => view.getFloat64(at, le) }
    case 0x0e: // sint64
    case 0x0f: // uint64
    case 0x10: // uint64z
      return { bytes: 8, read: () => Number.NaN }
    default:
      return null
  }
}

function invalidValueOf(encoded: number): number | null {
  switch (encoded & 0x1f) {
    case 0x00:
    case 0x02:
    case 0x0d:
      return 0xff
    case 0x01:
      return 0x7f
    case 0x03:
      return 0x7fff
    case 0x04:
      return 0xffff
    case 0x05:
      return 0x7fffffff
    case 0x06:
      return 0xffffffff
    case 0x0a:
    case 0x0b:
    case 0x0c:
      return 0
    default:
      return null
  }
}

export function looksLikeFit(bytes: Uint8Array): boolean {
  if (bytes.length < MIN_HEADER_BYTES) return false
  return SIGNATURE.every((byte, index) => bytes[SIGNATURE_OFFSET + index] === byte)
}

/**
 * Reads every message in the file, or returns null if it cannot be read at all.
 *
 * Truncation is the failure worth surviving: a file cut short still has whole
 * messages at the front, so a stream that breaks after some of them keeps them.
 * One that breaks before the first is not a short file but an unreadable one.
 */
export function readFitMessages(bytes: Uint8Array): FitMessage[] | null {
  if (!looksLikeFit(bytes)) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const headerBytes = bytes[0]
  if (!HEADER_SIZES.includes(headerBytes)) return null

  const declared = view.getUint32(4, true)
  const end = Math.min(headerBytes + declared, bytes.length)

  const definitions = new Map<number, { globalNumber: number; le: boolean; fields: FieldDefinition[] }>()
  const messages: FitMessage[] = []
  let rollingTimestamp: number | undefined
  let at = headerBytes
  const broken = () => (messages.length > 0 ? messages : null)

  while (at < end) {
    const header = bytes[at]
    at += 1

    if ((header & COMPRESSED_TIMESTAMP) === 0 && (header & DEFINITION_MESSAGE) !== 0) {
      if (at + 5 > end) return broken()
      const le = bytes[at + 1] === 0
      const globalNumber = le ? view.getUint16(at + 2, true) : view.getUint16(at + 2, false)
      const count = bytes[at + 4]
      at += 5

      const fields: FieldDefinition[] = []
      if (at + count * 3 > end) return broken()
      for (let index = 0; index < count; index += 1) {
        fields.push({
          number: bytes[at],
          bytes: bytes[at + 1],
          baseType: bytes[at + 2],
          developer: false,
        })
        at += 3
      }

      if ((header & DEVELOPER_FIELDS) !== 0) {
        if (at >= end) return broken()
        const developerCount = bytes[at]
        at += 1
        if (at + developerCount * 3 > end) return broken()
        for (let index = 0; index < developerCount; index += 1) {
          // Nothing reads these, but their bytes still sit in every data message.
          fields.push({ number: bytes[at], bytes: bytes[at + 1], baseType: 0x02, developer: true })
          at += 3
        }
      }

      definitions.set(header & LOCAL_NUMBER_MASK, { globalNumber, le, fields })
      continue
    }

    const compressed = (header & COMPRESSED_TIMESTAMP) !== 0
    const localNumber = compressed ? (header >> 5) & 0x03 : header & LOCAL_NUMBER_MASK
    const definition = definitions.get(localNumber)
    if (!definition) return broken()

    const message: FitMessage = { globalNumber: definition.globalNumber, fields: new Map() }

    for (const field of definition.fields) {
      if (at + field.bytes > end) return broken()
      const baseType = baseTypeOf(field.baseType)
      if (!baseType || field.developer || baseType.bytes > field.bytes) {
        at += field.bytes
        continue
      }
      // A field wider than its base type is an array; only its first value is used.
      const value = baseType.read(view, at, definition.le)
      at += field.bytes
      if (value !== invalidValueOf(field.baseType) && !Number.isNaN(value)) {
        message.fields.set(field.number, value)
      }
    }

    if (compressed && rollingTimestamp !== undefined) {
      // Arithmetic, not bit masks: timestamps are unsigned 32 bit, and JavaScript
      // bitwise operators treat them as signed.
      const offset = header & COMPRESSED_OFFSET_MASK
      const previous = rollingTimestamp % COMPRESSED_OFFSET_PERIOD
      rollingTimestamp =
        rollingTimestamp -
        previous +
        offset +
        (offset >= previous ? 0 : COMPRESSED_OFFSET_PERIOD)
      message.fields.set(FIT_TIMESTAMP_FIELD, rollingTimestamp)
    } else {
      const timestamp = message.fields.get(FIT_TIMESTAMP_FIELD)
      if (timestamp !== undefined) rollingTimestamp = timestamp
    }

    messages.push(message)
  }

  return messages
}
