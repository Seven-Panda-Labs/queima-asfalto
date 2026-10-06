import { describe, expect, it } from 'vitest'
import { FIT_TIMESTAMP_FIELD, looksLikeFit, readFitMessages } from './fit'
import { buildFitFile, UINT8, UINT16, UINT32 } from './fixtures/fitFile'

const RECORD = 20
const timestamp = { number: FIT_TIMESTAMP_FIELD, baseType: UINT32, bytes: 4 }
const heartRate = { number: 3, baseType: UINT8, bytes: 1 }

describe('looksLikeFit', () => {
  it('recognises the signature in the header', () => {
    expect(looksLikeFit(buildFitFile([]))).toBe(true)
  })

  it('does not mistake XML for FIT', () => {
    expect(looksLikeFit(new TextEncoder().encode('<?xml version="1.0"?><gpx></gpx>'))).toBe(false)
  })

  it('does not read past a file shorter than a header', () => {
    expect(looksLikeFit(new Uint8Array([12, 0x20, 0, 0]))).toBe(false)
  })
})

describe('readFitMessages', () => {
  it('reads each data message through the definition before it', () => {
    const messages = readFitMessages(
      buildFitFile([
        { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp, heartRate] } },
        { data: { localNumber: 0, values: [1000, 150] } },
        { data: { localNumber: 0, values: [1001, 152] } },
      ]),
    )
    expect(messages).toHaveLength(2)
    expect(messages![1].globalNumber).toBe(RECORD)
    expect(messages![1].fields.get(FIT_TIMESTAMP_FIELD)).toBe(1001)
    expect(messages![1].fields.get(3)).toBe(152)
  })

  it('leaves out a field the device marked as having nothing', () => {
    // A heart rate strap that has not paired yet writes 0xFF, not zero.
    const [message] = readFitMessages(
      buildFitFile([
        { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp, heartRate] } },
        { data: { localNumber: 0, values: [1000, null] } },
      ]),
    )!
    expect(message.fields.has(3)).toBe(false)
    expect(message.fields.get(FIT_TIMESTAMP_FIELD)).toBe(1000)
  })

  it('honours a definition written big endian', () => {
    const altitude = { number: 2, baseType: UINT16, bytes: 2 }
    const [message] = readFitMessages(
      buildFitFile([
        { define: { localNumber: 0, globalNumber: RECORD, fields: [altitude], bigEndian: true } },
        { data: { localNumber: 0, values: [2680] } },
      ]),
    )!
    expect(message.fields.get(2)).toBe(2680)
  })

  it('steps over developer fields to reach what follows', () => {
    const messages = readFitMessages(
      buildFitFile([
        {
          define: {
            localNumber: 0,
            globalNumber: RECORD,
            fields: [timestamp, heartRate],
            developerFieldBytes: [4, 2],
          },
        },
        { data: { localNumber: 0, values: [1000, 150] } },
        { data: { localNumber: 0, values: [1001, 151] } },
      ]),
    )!
    expect(messages.map((message) => message.fields.get(3))).toEqual([150, 151])
  })

  it('rebuilds a compressed timestamp from the last full one, across its 32 second wrap', () => {
    const messages = readFitMessages(
      buildFitFile([
        { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp, heartRate] } },
        { data: { localNumber: 0, values: [1000, 150] } },
        // 30 lands at 1022. The next offset, 2, is below 30, so the clock wrapped.
        { define: { localNumber: 1, globalNumber: RECORD, fields: [heartRate] } },
        { data: { localNumber: 1, values: [151], compressedOffset: 30 } },
        { data: { localNumber: 1, values: [152], compressedOffset: 2 } },
      ]),
    )!
    expect(messages.map((message) => message.fields.get(FIT_TIMESTAMP_FIELD))).toEqual([
      1000, 1022, 1026,
    ])
  })

  it('keeps the whole messages of a file cut short', () => {
    const whole = buildFitFile([
      { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp, heartRate] } },
      { data: { localNumber: 0, values: [1000, 150] } },
      { data: { localNumber: 0, values: [1001, 151] } },
    ])
    // Cut inside the second data message, and leave the declared length lying.
    const messages = readFitMessages(whole.slice(0, whole.length - 5))
    expect(messages).toHaveLength(1)
    expect(messages![0].fields.get(3)).toBe(150)
  })

  it('cannot read a stream whose first message no definition announced', () => {
    const file = buildFitFile([
      { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp] } },
      { data: { localNumber: 0, values: [1000] } },
    ])
    // Header, then a 9 byte definition: the data message's header byte comes next.
    const dataHeader = 12 + 9
    file[dataHeader] = 0x05
    expect(readFitMessages(file)).toBeNull()
  })

  it('keeps what it read before a message no definition announced', () => {
    const file = buildFitFile([
      { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp] } },
      { data: { localNumber: 0, values: [1000] } },
      { data: { localNumber: 0, values: [1001] } },
    ])
    // Header, a 9 byte definition and one 5 byte message, then the second message.
    const secondHeader = 12 + 9 + 5
    file[secondHeader] = 0x05
    expect(readFitMessages(file)?.map((message) => message.fields.get(FIT_TIMESTAMP_FIELD))).toEqual([1000])
  })

  it('reads a file that starts partway into a larger buffer', () => {
    // Node hands over Buffers carved from a shared pool, at a non-zero offset.
    const file = buildFitFile([
      { define: { localNumber: 0, globalNumber: RECORD, fields: [timestamp, heartRate] } },
      { data: { localNumber: 0, values: [1000, 150] } },
    ])
    const pool = new Uint8Array(file.length + 7)
    pool.set(file, 7)
    const [message] = readFitMessages(pool.subarray(7))!
    expect(message.fields.get(3)).toBe(150)
  })

  it('refuses a header of a size the format does not have', () => {
    const file = buildFitFile([])
    file[0] = 200
    expect(readFitMessages(file)).toBeNull()
  })
})
