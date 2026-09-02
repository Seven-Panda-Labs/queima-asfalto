import { describe, expect, it } from 'vitest'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { Timestamp } from 'firebase/firestore'
import {
  BACKUP_MANIFEST_FILE,
  BACKUP_SECTION_FILES,
  buildBackupTextFiles,
  decodeDocumentData,
  emptyBackupSections,
  encodeDocumentData,
  parseBackupTextFiles,
  type BackupPayload,
  type BackupSections,
} from './backupFormat'

const USER_ID = 'user-ze'
const EXPORTED_AT = new Date('2026-08-03T10:42:07.512Z')

function ts(iso: string, nanoseconds = 0): Timestamp {
  return new Timestamp(Math.floor(new Date(iso).getTime() / 1000), nanoseconds)
}

/**
 * Raw Firestore documents as the export path reads them: fictional data only,
 * one fully populated document plus one minimal document per collection, and a
 * legacy-encoded event so the round trip proves nothing gets normalized.
 */
function rawFixture() {
  return {
    events: [
      {
        id: 'event-complete',
        data: {
          userId: USER_ID,
          name: 'Maratona de Berlim',
          date: ts('2026-09-27T07:00:00Z'),
          realDistance: 42.195,
          eventType: 'km_42_2',
          location: 'Berlim, Alemanha',
          locationLat: 52.5163,
          locationLng: 13.3777,
          locationGeocodeQuery: 'Berlim, Alemanha',
          locationGeocodedAt: ts('2026-01-04T18:22:31Z', 415000000),
          status: 'completed',
          emoji: '🏅',
          notes: 'Recorde pessoal.',
          time: '03:42:11',
          pace: '5:16',
          classification: '1243',
          resultsUrl: 'https://example.test/results/berlin',
          resultsPlatform: 'sccevents',
          parkrunEventSlug: null,
          parkrunCountryUrl: null,
          resultsVerified: true,
          createdAt: ts('2025-11-02T09:14:00Z', 123456789),
          updatedAt: ts('2026-09-28T20:01:02Z', 987654321),
        },
      },
      {
        // Legacy portuguese encodings, and every optional field simply absent.
        id: 'event-legacy',
        data: {
          userId: USER_ID,
          name: 'Meia de Lisboa',
          date: ts('2019-03-17T09:00:00Z'),
          realDistance: 21.1,
          eventType: '21.1Km',
          location: 'Lisboa',
          status: 'Concluído',
        },
      },
    ],
    eventMedia: [
      {
        id: 'media-photo',
        eventId: 'event-complete',
        data: {
          userId: USER_ID,
          type: 'photo',
          storagePath: `users/${USER_ID}/events/event-complete/media/media-photo.jpg`,
          downloadUrl: `https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/users%2F${USER_ID}%2Fevents%2Fevent-complete%2Fmedia%2Fmedia-photo.jpg?alt=media&token=abc`,
          mimeType: 'image/jpeg',
          sizeBytes: 204800,
          createdAt: ts('2026-09-27T12:00:00Z', 1),
        },
      },
      {
        id: 'media-video',
        eventId: 'event-complete',
        data: {
          userId: USER_ID,
          type: 'video',
          storagePath: `users/${USER_ID}/events/event-complete/media/media-video.mp4`,
          downloadUrl: `https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/users%2F${USER_ID}%2Fevents%2Fevent-complete%2Fmedia%2Fmedia-video.mp4?alt=media&token=def`,
          mimeType: 'video/mp4',
          sizeBytes: 8388608,
          durationSeconds: 42.5,
          createdAt: ts('2026-09-27T12:05:00Z'),
        },
      },
    ],
    goals: [
      {
        id: 'goal-1',
        data: {
          userId: USER_ID,
          eventType: 'km_10',
          targetCount: 12,
          year: 2026,
          emoji: '🎯',
          notes: null,
          createdAt: ts('2026-01-01T00:00:00Z'),
          updatedAt: ts('2026-01-01T00:00:00Z'),
        },
      },
    ],
    performanceGoals: [
      {
        id: 'pg-1',
        data: {
          userId: USER_ID,
          type: 'time_target',
          eventType: 'km_42_2',
          year: 2026,
          targetTime: '03:45:00',
          emoji: null,
          notes: 'Sub 3:45',
          createdAt: ts('2026-01-02T08:00:00Z'),
          updatedAt: ts('2026-01-02T08:00:00Z'),
        },
      },
    ],
    bucketListItems: [
      {
        id: 'bucket-1',
        data: {
          userId: USER_ID,
          name: 'Comrades Marathon',
          location: 'Durban, África do Sul',
          realDistance: 89,
          disciplines: ['km_42_2', 'km_21_1'],
          targetMonth: '2028-06',
          link: 'https://example.test/comrades',
          emoji: '🇿🇦',
          notes: null,
          // Written by the shares callable; no docToX mapper carries it.
          lastEditedBy: 'user-grantee',
          createdAt: ts('2026-02-11T21:30:00Z'),
          updatedAt: ts('2026-07-01T06:45:00Z'),
        },
      },
    ],
    races: [
      {
        id: 'race-berlim',
        data: {
          userId: USER_ID,
          name: 'Maratona de Berlim',
          location: 'Berlim, Alemanha',
          locationLat: 52.5163,
          locationLng: 13.3777,
          locationGeocodeQuery: 'Berlim, Alemanha',
          locationGeocodedAt: ts('2026-01-04T18:22:31Z', 415000000),
          catalogRaceId: 'berlin-marathon',
          officialUrl: 'https://example.test/berlin',
          createdAt: ts('2026-01-04T18:22:31Z'),
          updatedAt: ts('2026-01-04T18:22:31Z'),
        },
      },
    ],
    raceEntries: [
      {
        id: 'entry-berlim-2027',
        data: {
          userId: USER_ID,
          raceId: 'race-berlim',
          bucketListItemId: 'bucket-1',
          year: 2027,
          discipline: 'km_42_2',
          raceDate: ts('2027-09-26T07:00:00Z'),
          raceDateConfirmed: false,
          entryMethod: 'lottery',
          entryStatus: 'applied',
          registrationOpensAt: ts('2026-09-25T08:00:00Z'),
          registrationClosesAt: ts('2026-11-06T22:59:00Z'),
          lotteryDrawAt: ts('2026-11-20T10:00:00Z'),
          placeConfirmByAt: ts('2026-12-04T22:59:00Z'),
          registrationUrl: 'https://example.test/lottery',
          fee: 205,
          feeCurrency: 'EUR',
          checklist: [{ label: 'Provar o tempo de qualificação', done: false }],
          notes: null,
          createdAt: ts('2026-09-02T09:00:00Z'),
          updatedAt: ts('2026-09-02T09:00:00Z'),
        },
      },
    ],
    userProfile: [
      {
        id: USER_ID,
        data: {
          name: 'Zé Ninguém',
          email: 'ze@example.test',
          appLanguage: 'pt',
          notificationsEnabled: true,
          reminderDaysBefore: 3,
          reminderTime: '08:30',
          resultFirstName: 'Zé',
          resultLastName: 'Ninguém',
          resultNameAliases: ['Ze Ninguem', 'J. Ninguem'],
          parkrunnerId: 'A1234567',
          favoriteParkrunSlugs: ['lisboa', 'tempelhoferfeld'],
          createdAt: ts('2025-10-01T10:00:00Z'),
          updatedAt: ts('2026-08-01T10:00:00Z'),
        },
      },
    ],
    shares: [
      {
        id: 'share-1',
        data: {
          ownerId: USER_ID,
          ownerDisplayName: 'Zé Ninguém',
          ownerEmail: 'ze@example.test',
          granteeId: 'user-maria',
          granteeEmail: 'maria@example.test',
          granteeDisplayName: 'Maria Ninguém',
          status: 'revoked',
          permissions: { bucketList: 'edit', events: 'view', goals: 'view', performanceGoals: 'none', media: 'view' },
          createdAt: ts('2026-03-01T00:00:00Z'),
          updatedAt: ts('2026-05-01T00:00:00Z'),
          revokedAt: ts('2026-05-01T00:00:00Z'),
        },
      },
    ],
  }
}

/** Encodes the raw fixture exactly as the export path does. */
function buildPayload(): { payload: BackupPayload; raw: ReturnType<typeof rawFixture> } {
  const raw = rawFixture()
  const sections = emptyBackupSections()

  for (const [key, documents] of Object.entries(raw) as [keyof BackupSections, typeof raw.events][]) {
    sections[key] = documents.map((document) => ({
      id: document.id,
      ...('eventId' in document ? { eventId: document.eventId as string } : {}),
      data: encodeDocumentData(document.data, `${key}/${document.id}`),
    }))
  }

  return {
    payload: { userId: USER_ID, exportedAt: EXPORTED_AT, appVersion: '1.15.0', sections },
    raw,
  }
}

/** Mirrors buildUserBackupZip: json deflated, binaries stored. */
function zipPayload(
  payload: BackupPayload,
  mediaFiles: Map<string, Uint8Array> = new Map(),
): Uint8Array {
  const entries: Record<string, [Uint8Array, { level: 0 | 6 }]> = {}
  for (const [name, text] of Object.entries(buildBackupTextFiles(payload, mediaFiles))) {
    entries[name] = [strToU8(text), { level: 6 }]
  }
  for (const [name, bytes] of mediaFiles) {
    entries[name] = [bytes, { level: 0 }]
  }
  return zipSync(entries, { mtime: payload.exportedAt })
}

function unzipToText(bytes: Uint8Array): Record<string, string> {
  return Object.fromEntries(
    Object.entries(unzipSync(bytes)).map(([name, data]) => [name, strFromU8(data)]),
  )
}

describe('backup zip round trip', () => {
  it('survives build -> zip -> unzip -> parse unchanged', () => {
    const { payload } = buildPayload()

    const parsed = parseBackupTextFiles(unzipToText(zipPayload(payload)))

    expect(parsed.sections).toEqual(payload.sections)
    expect(parsed.unknownFiles).toEqual([])
  })

  it('produces a real zip container holding the manifest and every section file', () => {
    const { payload } = buildPayload()
    const bytes = zipPayload(payload)

    expect(bytes[0]).toBe(0x50)
    expect(bytes[1]).toBe(0x4b)
    expect(Object.keys(unzipToText(bytes)).sort()).toEqual(
      [BACKUP_MANIFEST_FILE, ...Object.values(BACKUP_SECTION_FILES)].sort(),
    )
  })

  it('carries the export metadata and per-section counts in the manifest', () => {
    const { payload, raw } = buildPayload()

    const parsed = parseBackupTextFiles(unzipToText(zipPayload(payload)))

    expect(parsed.manifest.userId).toBe(USER_ID)
    expect(parsed.manifest.appVersion).toBe('1.15.0')
    expect(parsed.manifest.exportedAt).toBe(EXPORTED_AT.toISOString())
    expect(parsed.manifest.counts).toEqual({
      events: raw.events.length,
      eventMedia: raw.eventMedia.length,
      eventTracks: 0,
      goals: raw.goals.length,
      performanceGoals: raw.performanceGoals.length,
      bucketListItems: raw.bucketListItems.length,
      races: raw.races.length,
      raceEntries: raw.raceEntries.length,
      userProfile: 1,
      shares: 1,
    })
  })

  it('restores every document to the exact Firestore values it was read as', () => {
    const { payload, raw } = buildPayload()

    const parsed = parseBackupTextFiles(unzipToText(zipPayload(payload)))

    for (const [key, documents] of Object.entries(raw) as [keyof BackupSections, typeof raw.events][]) {
      const restored = parsed.sections[key].map((document) => decodeDocumentData(document.data))
      expect(restored).toEqual(documents.map((document) => document.data))
    }
  })

  it('keeps nanosecond precision and legacy encodings through the zip', () => {
    const { payload } = buildPayload()

    const parsed = parseBackupTextFiles(unzipToText(zipPayload(payload)))
    const complete = decodeDocumentData(parsed.sections.events[0].data)
    const legacy = decodeDocumentData(parsed.sections.events[1].data)

    expect((complete.createdAt as Timestamp).nanoseconds).toBe(123456789)
    expect((complete.updatedAt as Timestamp).nanoseconds).toBe(987654321)
    expect(legacy.status).toBe('Concluído')
    expect(legacy.eventType).toBe('21.1Km')
    expect(legacy).not.toHaveProperty('createdAt')
  })

  it('is stable across a second export of the parsed backup', () => {
    const { payload } = buildPayload()

    const first = parseBackupTextFiles(unzipToText(zipPayload(payload)))
    const second = parseBackupTextFiles(
      unzipToText(
        zipPayload({
          userId: first.manifest.userId,
          exportedAt: EXPORTED_AT,
          appVersion: first.manifest.appVersion,
          sections: first.sections,
        }),
      ),
    )

    // Compare file text rather than zip bytes: fflate stamps mtimes.
    expect(buildBackupTextFiles({ ...payload, sections: second.sections })).toEqual(
      buildBackupTextFiles(payload),
    )
  })

  it('rejects a zip whose json was tampered with after export', () => {
    const { payload } = buildPayload()
    const files = unzipToText(zipPayload(payload))
    const events = JSON.parse(files[BACKUP_SECTION_FILES.events]) as { documents: unknown[] }
    events.documents.pop()
    files[BACKUP_SECTION_FILES.events] = JSON.stringify(events)

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'count_mismatch' }),
    )
  })

  it('round-trips photo and video binaries byte for byte', () => {
    const { payload } = buildPayload()
    // Non-text bytes on purpose: a JPEG SOI marker and a high-entropy tail.
    const photo = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff])
    const video = new Uint8Array(2048)
    for (let index = 0; index < video.length; index += 1) video[index] = (index * 31 + 7) % 256

    const mediaFiles = new Map([
      ['media/event-complete/media-photo.jpg', photo],
      ['media/event-complete/media-video.mp4', video],
    ])

    const bytes = zipPayload(payload, mediaFiles)
    const entries = unzipSync(bytes)

    expect(new Uint8Array(entries['media/event-complete/media-photo.jpg'])).toEqual(photo)
    expect(new Uint8Array(entries['media/event-complete/media-video.mp4'])).toEqual(video)
  })

  it('stores binaries uncompressed and still deflates the json', () => {
    const { payload } = buildPayload()
    // Highly compressible, so a deflated entry would be much smaller than stored.
    const compressible = new Uint8Array(4096)
    const mediaFiles = new Map([['media/event-complete/media-photo.jpg', compressible]])

    const bytes = zipPayload(payload, mediaFiles)
    const entries = unzipSync(bytes)

    expect(new Uint8Array(entries['media/event-complete/media-photo.jpg'])).toEqual(compressible)
    // The stored 4 KiB survives in the archive rather than collapsing to ~30 bytes.
    expect(bytes.byteLength).toBeGreaterThan(4096)
    // The JSON, by contrast, is deflated well below its own length.
    expect(bytes.byteLength).toBeLessThan(
      4096 + Object.values(buildBackupTextFiles(payload, mediaFiles)).join('').length,
    )
  })

  it('separates media entries from json when reading, and counts them in the manifest', () => {
    const { payload } = buildPayload()
    const mediaFiles = new Map([
      ['media/event-complete/media-photo.jpg', new Uint8Array([1, 2, 3, 4])],
    ])

    const entries = unzipSync(zipPayload(payload, mediaFiles))
    const text: Record<string, string> = {}
    const binaries = new Map<string, Uint8Array>()
    for (const [name, data] of Object.entries(entries)) {
      if (name.startsWith('media/')) binaries.set(name, data)
      else text[name] = strFromU8(data)
    }

    const parsed = parseBackupTextFiles(text, binaries)

    expect(parsed.manifest.mediaFiles).toEqual({ count: 1, sizeBytes: 4 })
    expect(parsed.mediaFiles.size).toBe(1)
    expect(parsed.unknownFiles).toEqual([])
    // Metadata is unaffected by the presence of binaries.
    expect(parsed.sections).toEqual(payload.sections)
  })

  it('reads a metadata-only backup as carrying no binaries', () => {
    const { payload } = buildPayload()

    const parsed = parseBackupTextFiles(unzipToText(zipPayload(payload)))

    expect(parsed.mediaFiles.size).toBe(0)
    expect(parsed.manifest.mediaFiles).toEqual({ count: 0, sizeBytes: 0 })
  })

  it('reads an xlsx-shaped zip as a missing manifest rather than a corrupt file', () => {
    const notABackup = zipSync({
      '[Content_Types].xml': strToU8('<Types/>'),
      'xl/workbook.xml': strToU8('<workbook/>'),
    })

    expect(() => parseBackupTextFiles(unzipToText(notABackup))).toThrow(
      expect.objectContaining({ code: 'missing_manifest' }),
    )
  })
})
