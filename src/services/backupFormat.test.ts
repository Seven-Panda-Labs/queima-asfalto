import { describe, expect, it } from 'vitest'
import { GeoPoint, Timestamp } from 'firebase/firestore'
import {
  BACKUP_MANIFEST_FILE,
  BACKUP_SCHEMA_VERSION,
  BACKUP_SECTION_FILES,
  BackupFormatError,
  backupFileName,
  buildBackupTextFiles,
  decodeDocumentData,
  emptyBackupSections,
  encodeDocumentData,
  isKnownBackupEntry,
  parseBackupTextFiles,
  sanitizeProfileForRestore,
  validateRestoreDocument,
  type BackupDocument,
  type BackupPayload,
  type BackupSections,
  type JsonValue,
} from './backupFormat'

function sectionsWith(overrides: Partial<BackupSections>): BackupSections {
  return { ...emptyBackupSections(), ...overrides }
}

function payloadWith(overrides: Partial<BackupSections>): BackupPayload {
  return {
    userId: 'user-ze',
    exportedAt: new Date('2026-08-03T10:42:07.512Z'),
    appVersion: '1.15.0',
    sections: sectionsWith(overrides),
  }
}

function roundTrip(data: Record<string, unknown>): Record<string, unknown> {
  const encoded = encodeDocumentData(data, 'events/event-1')
  const reparsed = JSON.parse(JSON.stringify(encoded)) as Record<string, JsonValue>
  return decodeDocumentData(reparsed)
}

function mediaDocument(overrides: Partial<Record<string, unknown>> = {}): {
  document: BackupDocument
  data: Record<string, unknown>
} {
  const userId = 'user-ze'
  const eventId = 'event-1'
  const mediaId = 'media-1'
  return {
    document: { id: mediaId, eventId, data: {} },
    data: {
      userId,
      type: 'photo',
      storagePath: `users/${userId}/events/${eventId}/media/${mediaId}.jpg`,
      downloadUrl: `https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/users%2F${userId}%2Fevents%2F${eventId}%2Fmedia%2F${mediaId}.jpg?alt=media&token=abc`,
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      ...overrides,
    },
  }
}

describe('encodeDocumentData / decodeDocumentData', () => {
  // Firestore itself stores microseconds; the encoder must not lose precision
  // on top of that, which a Date round trip (milliseconds) would.
  it('round-trips a Timestamp to the nanosecond', () => {
    const decoded = roundTrip({ date: new Timestamp(1780297200, 123456789) })
    const date = decoded.date as Timestamp

    expect(date).toBeInstanceOf(Timestamp)
    expect(date.seconds).toBe(1780297200)
    expect(date.nanoseconds).toBe(123456789)
  })

  it('keeps the readable iso companion field on the wire', () => {
    const encoded = encodeDocumentData(
      { createdAt: new Timestamp(1780297200, 123000000) },
      'events/event-1',
    )

    expect(encoded.createdAt).toEqual({
      __type: 'timestamp',
      iso: '2026-06-01T07:00:00.123Z',
      seconds: 1780297200,
      nanoseconds: 123000000,
    })
  })

  it('falls back to the iso field when seconds are missing', () => {
    const decoded = decodeDocumentData({
      createdAt: { __type: 'timestamp', iso: '2026-06-01T15:00:00.123Z' },
    })
    const createdAt = decoded.createdAt as Timestamp

    expect(createdAt.toDate().toISOString()).toBe('2026-06-01T15:00:00.123Z')
  })

  it('distinguishes null from a missing key', () => {
    const decoded = roundTrip({ emoji: null, notes: 'nota' })

    expect(decoded).toHaveProperty('emoji', null)
    expect(decoded).not.toHaveProperty('time')
    expect(decoded.notes).toBe('nota')
  })

  it('drops undefined values', () => {
    const encoded = encodeDocumentData({ emoji: undefined, name: 'Zé' }, 'events/event-1')

    expect(encoded).not.toHaveProperty('emoji')
    expect(encoded.name).toBe('Zé')
  })

  it('preserves legacy portuguese enum encodings verbatim', () => {
    const decoded = roundTrip({ status: 'Concluído', eventType: '21.1Km' })

    expect(decoded.status).toBe('Concluído')
    expect(decoded.eventType).toBe('21.1Km')
  })

  it('preserves fields the domain mappers do not know about', () => {
    const decoded = roundTrip({ lastEditedBy: 'user-grantee', eventType: 'km_10' })

    expect(decoded.lastEditedBy).toBe('user-grantee')
  })

  it('round-trips nested arrays and maps', () => {
    const decoded = roundTrip({
      disciplines: ['km_5', 'km_21_1'],
      resultNameAliases: ['Zé N.', 'Ze Ninguem'],
      nested: { deep: { value: 1, when: new Timestamp(100, 500) } },
    })

    expect(decoded.disciplines).toEqual(['km_5', 'km_21_1'])
    expect(decoded.resultNameAliases).toEqual(['Zé N.', 'Ze Ninguem'])
    const when = (decoded.nested as { deep: { when: Timestamp } }).deep.when
    expect(when.nanoseconds).toBe(500)
  })

  it('round-trips non-finite doubles that JSON would silently null out', () => {
    const decoded = roundTrip({ a: Number.NaN, b: Infinity, c: -Infinity })

    expect(decoded.a).toBeNaN()
    expect(decoded.b).toBe(Infinity)
    expect(decoded.c).toBe(-Infinity)
  })

  it('throws unsupported_value for a class-based Firestore value', () => {
    expect(() => encodeDocumentData({ where: new GeoPoint(1, 2) }, 'events/event-1')).toThrow(
      expect.objectContaining({ code: 'unsupported_value', detail: 'events/event-1 where' }),
    )
  })

  it('throws unsupported_value for a map that collides with the type tag', () => {
    expect(() => encodeDocumentData({ meta: { __type: 'timestamp' } }, 'events/event-1')).toThrow(
      BackupFormatError,
    )
  })

  it('throws unsupported_value for an unknown type tag on decode', () => {
    expect(() => decodeDocumentData({ what: { __type: 'geopoint' } })).toThrow(
      expect.objectContaining({ code: 'unsupported_value' }),
    )
  })
})

describe('backupFileName / isKnownBackupEntry', () => {
  it('names the file after the local export date', () => {
    expect(backupFileName(new Date(2026, 7, 3, 10, 42))).toBe(
      'queima_asfalto_backup_2026-08-03.zip',
    )
  })

  it('recognises the manifest and every section file', () => {
    expect(isKnownBackupEntry(BACKUP_MANIFEST_FILE)).toBe(true)
    expect(isKnownBackupEntry(BACKUP_SECTION_FILES.events)).toBe(true)
    expect(isKnownBackupEntry('trainingPlans.json')).toBe(false)
    expect(isKnownBackupEntry('../../etc/passwd')).toBe(false)
  })
})

describe('buildBackupTextFiles', () => {
  it('writes a manifest plus one file per section', () => {
    const files = buildBackupTextFiles(payloadWith({}))

    expect(Object.keys(files).sort()).toEqual(
      [BACKUP_MANIFEST_FILE, ...Object.values(BACKUP_SECTION_FILES)].sort(),
    )
  })

  it('records the export metadata and the omission contract in the manifest', () => {
    const files = buildBackupTextFiles(
      payloadWith({ events: [{ id: 'event-1', data: { name: 'Maratona' } }] }),
    )
    const manifest = JSON.parse(files[BACKUP_MANIFEST_FILE]) as Record<string, unknown>

    expect(manifest.app).toBe('queima-asfalto')
    expect(manifest.kind).toBe('user-backup')
    expect(manifest.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(manifest.appVersion).toBe('1.15.0')
    expect(manifest.exportedAt).toBe('2026-08-03T10:42:07.512Z')
    expect(manifest.userId).toBe('user-ze')
    expect(manifest.counts).toMatchObject({ events: 1, goals: 0 })
    expect(manifest.exportOnly).toEqual(['shares'])
    expect(manifest.omitted).toContain('storageBinaries')
    expect(manifest.omitted).toContain('fcmTokens')
  })
})

describe('parseBackupTextFiles', () => {
  function filesFor(payload: BackupPayload): Record<string, string> {
    return buildBackupTextFiles(payload)
  }

  it('parses a backup this module produced', () => {
    const payload = payloadWith({
      events: [{ id: 'event-1', data: { name: 'Maratona', status: 'Concluído' } }],
      eventMedia: [{ id: 'media-1', eventId: 'event-1', data: { type: 'photo' } }],
    })

    const parsed = parseBackupTextFiles(filesFor(payload))

    expect(parsed.manifest.userId).toBe('user-ze')
    expect(parsed.sections.events).toEqual(payload.sections.events)
    expect(parsed.sections.eventMedia[0].eventId).toBe('event-1')
    expect(parsed.unknownFiles).toEqual([])
  })

  it('rejects a zip with no manifest', () => {
    expect(() => parseBackupTextFiles({ 'events.json': '{}' })).toThrow(
      expect.objectContaining({ code: 'missing_manifest' }),
    )
  })

  it('rejects a manifest that is not valid json', () => {
    expect(() => parseBackupTextFiles({ [BACKUP_MANIFEST_FILE]: '{ nope' })).toThrow(
      expect.objectContaining({ code: 'invalid_manifest' }),
    )
  })

  it('rejects a manifest that is not an object', () => {
    expect(() => parseBackupTextFiles({ [BACKUP_MANIFEST_FILE]: '[]' })).toThrow(
      expect.objectContaining({ code: 'invalid_manifest' }),
    )
  })

  it('rejects a backup produced by another app', () => {
    const files = filesFor(payloadWith({}))
    files[BACKUP_MANIFEST_FILE] = JSON.stringify({
      app: 'some-other-app',
      kind: 'user-backup',
      schemaVersion: 1,
    })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'foreign_backup' }),
    )
  })

  it('rejects a backup from a newer schema version', () => {
    const files = filesFor(payloadWith({}))
    const manifest = JSON.parse(files[BACKUP_MANIFEST_FILE]) as Record<string, unknown>
    files[BACKUP_MANIFEST_FILE] = JSON.stringify({ ...manifest, schemaVersion: 99 })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'unsupported_schema_version', detail: '99' }),
    )
  })

  it('rejects a non-integer schema version', () => {
    const files = filesFor(payloadWith({}))
    const manifest = JSON.parse(files[BACKUP_MANIFEST_FILE]) as Record<string, unknown>
    files[BACKUP_MANIFEST_FILE] = JSON.stringify({ ...manifest, schemaVersion: 'one' })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'invalid_manifest' }),
    )
  })

  it('rejects a section file whose documents are not an array', () => {
    const files = filesFor(payloadWith({}))
    files[BACKUP_SECTION_FILES.events] = JSON.stringify({ collection: 'events', documents: {} })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'invalid_collection_file' }),
    )
  })

  it('rejects a document with an empty id', () => {
    const files = filesFor(payloadWith({}))
    files[BACKUP_SECTION_FILES.events] = JSON.stringify({
      collection: 'events',
      count: 1,
      documents: [{ id: '', data: {} }],
    })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'invalid_collection_file' }),
    )
  })

  it('rejects a media document without an eventId', () => {
    const files = filesFor(payloadWith({}))
    files[BACKUP_SECTION_FILES.eventMedia] = JSON.stringify({
      collection: 'eventMedia',
      count: 1,
      documents: [{ id: 'media-1', data: {} }],
    })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'invalid_collection_file' }),
    )
  })

  it('rejects duplicate ids inside one section file', () => {
    const files = filesFor(payloadWith({}))
    files[BACKUP_SECTION_FILES.goals] = JSON.stringify({
      collection: 'goals',
      count: 2,
      documents: [
        { id: 'goal-1', data: {} },
        { id: 'goal-1', data: {} },
      ],
    })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'invalid_collection_file' }),
    )
  })

  it('rejects a hand-edited count inside a section file', () => {
    const files = filesFor(payloadWith({ events: [{ id: 'event-1', data: {} }] }))
    files[BACKUP_SECTION_FILES.events] = JSON.stringify({
      collection: 'events',
      count: 7,
      documents: [{ id: 'event-1', data: {} }],
    })

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'count_mismatch' }),
    )
  })

  it('rejects a manifest count that disagrees with the section file', () => {
    const files = filesFor(payloadWith({ events: [{ id: 'event-1', data: {} }] }))
    const manifest = JSON.parse(files[BACKUP_MANIFEST_FILE]) as {
      counts: Record<string, number>
    }
    manifest.counts.events = 4
    files[BACKUP_MANIFEST_FILE] = JSON.stringify(manifest)

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'count_mismatch' }),
    )
  })

  it('rejects a manifest with no section files at all', () => {
    const files = filesFor(payloadWith({}))
    for (const name of Object.values(BACKUP_SECTION_FILES)) delete files[name]

    expect(() => parseBackupTextFiles(files)).toThrow(
      expect.objectContaining({ code: 'empty_backup' }),
    )
  })

  it('reads a missing section file as an empty section', () => {
    const files = filesFor(payloadWith({ events: [{ id: 'event-1', data: {} }] }))
    delete files[BACKUP_SECTION_FILES.goals]

    const parsed = parseBackupTextFiles(files)

    expect(parsed.sections.goals).toEqual([])
    expect(parsed.sections.events).toHaveLength(1)
  })

  it('ignores an unknown file from a future version', () => {
    const files = filesFor(payloadWith({}))
    files['trainingPlans.json'] = JSON.stringify({ collection: 'trainingPlans', documents: [] })

    const parsed = parseBackupTextFiles(files)

    expect(parsed.unknownFiles).toEqual(['trainingPlans.json'])
  })
})

describe('validateRestoreDocument', () => {
  const context = { userId: 'user-ze', knownEventIds: new Set(['event-1']) }

  function validEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      userId: 'user-ze',
      name: 'Maratona de Berlim',
      date: Timestamp.fromDate(new Date('2026-09-27T07:00:00Z')),
      realDistance: 42.2,
      eventType: 'km_42_2',
      location: 'Berlim',
      status: 'completed',
      ...overrides,
    }
  }

  function check(
    section: Parameters<typeof validateRestoreDocument>[0],
    data: Record<string, unknown>,
    document: BackupDocument = { id: 'doc-1', data: {} },
  ) {
    return validateRestoreDocument(section, document, data, context)
  }

  it('accepts a canonical event', () => {
    expect(check('events', validEvent())).toBeNull()
  })

  it('accepts an event using the legacy portuguese encodings', () => {
    expect(check('events', validEvent({ status: 'Concluído', eventType: '21.1Km' }))).toBeNull()
  })

  it('accepts an event with full geocode and results fields', () => {
    expect(
      check(
        'events',
        validEvent({
          locationLat: 52.52,
          locationLng: 13.405,
          locationGeocodeQuery: 'Berlim',
          locationGeocodedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
          resultsUrl: 'https://example.test/results',
          resultsPlatform: 'sccevents',
          parkrunEventSlug: null,
        }),
      ),
    ).toBeNull()
  })

  it('rejects a document owned by another account', () => {
    expect(check('events', validEvent({ userId: 'user-bob' }))).toBe('foreign_user')
  })

  it('rejects an event missing a required field', () => {
    const data = validEvent()
    delete data.date
    expect(check('events', data)).toBe('missing_required_field')
  })

  it('rejects an empty event name', () => {
    expect(check('events', validEvent({ name: '' }))).toBe('invalid_name')
  })

  it('rejects a non-string location', () => {
    expect(check('events', validEvent({ location: 42 }))).toBe('invalid_location')
  })

  it('rejects a non-positive distance', () => {
    expect(check('events', validEvent({ realDistance: 0 }))).toBe('invalid_distance')
  })

  it('rejects an unknown event type', () => {
    expect(check('events', validEvent({ eventType: 'triathlon' }))).toBe('invalid_event_type')
  })

  it('rejects an unknown status, including the unaccented legacy spelling', () => {
    expect(check('events', validEvent({ status: 'Concluido' }))).toBe('invalid_event_status')
  })

  it('rejects out-of-range coordinates and half-set pairs', () => {
    expect(check('events', validEvent({ locationLat: 99, locationLng: 0 }))).toBe('invalid_geocode')
    expect(check('events', validEvent({ locationLat: 52.52 }))).toBe('invalid_geocode')
  })

  it('rejects an unknown results platform', () => {
    expect(check('events', validEvent({ resultsPlatform: 'notatiming' }))).toBe(
      'invalid_results_field',
    )
  })

  it('validates goals', () => {
    const goal = { userId: 'user-ze', eventType: 'km_10', targetCount: 12, year: 2026 }

    expect(check('goals', goal)).toBeNull()
    expect(check('goals', { ...goal, targetCount: 1.5 })).toBe('invalid_target_count')
    expect(check('goals', { ...goal, targetCount: 0 })).toBe('invalid_target_count')
    expect(check('goals', { ...goal, year: 2026.5 })).toBe('invalid_year')
    expect(check('goals', { ...goal, eventType: 'nope' })).toBe('invalid_event_type')
  })

  it('validates the performance goal type conditionals', () => {
    const base = { userId: 'user-ze', eventType: 'km_10', year: 2026 }

    expect(check('performanceGoals', { ...base, type: 'pr_target' })).toBeNull()
    expect(check('performanceGoals', { ...base, type: 'pace_target', targetPace: '4:30' })).toBeNull()
    expect(check('performanceGoals', { ...base, type: 'time_target', targetTime: '00:45:00' })).toBeNull()

    expect(check('performanceGoals', { ...base, type: 'pace_target' })).toBe(
      'invalid_performance_goal',
    )
    expect(check('performanceGoals', { ...base, type: 'time_target' })).toBe(
      'invalid_performance_goal',
    )
    expect(check('performanceGoals', { ...base, type: 'pr_target', targetPace: '4:30' })).toBe(
      'invalid_performance_goal',
    )
    expect(check('performanceGoals', { ...base, type: 'other' })).toBe('invalid_performance_goal')
  })

  it('validates bucket list disciplines, including the legacy singular field', () => {
    const base = { userId: 'user-ze', name: 'Comrades', location: 'Durban', realDistance: 89 }

    expect(check('bucketListItems', { ...base, disciplines: ['km_42_2'] })).toBeNull()
    expect(check('bucketListItems', { ...base, eventType: '42.2Km' })).toBeNull()
    expect(check('bucketListItems', { ...base, disciplines: [] })).toBe('invalid_disciplines')
    expect(
      check('bucketListItems', { ...base, disciplines: ['km_5', 'km_10', 'km_21_1', 'km_42_2', 'km_5'] }),
    ).toBe('invalid_disciplines')
    expect(check('bucketListItems', { ...base, disciplines: ['ultra'] })).toBe('invalid_disciplines')
    expect(check('bucketListItems', base)).toBe('invalid_disciplines')
  })

  it('accepts a media document restored at its original ids', () => {
    const { document, data } = mediaDocument()
    expect(check('eventMedia', data, document)).toBeNull()
  })

  it('accepts the firebasestorage.app download url form', () => {
    const { document, data } = mediaDocument({
      downloadUrl:
        'https://demo-bucket.firebasestorage.app/o/users%2Fuser-ze%2Fevents%2Fevent-1%2Fmedia%2Fmedia-1.jpg?alt=media',
    })
    expect(check('eventMedia', data, document)).toBeNull()
  })

  it('rejects media whose storage path belongs to another account', () => {
    const { document, data } = mediaDocument({
      storagePath: 'users/user-bob/events/event-1/media/media-1.jpg',
    })
    expect(check('eventMedia', data, document)).toBe('invalid_media')
  })

  it('rejects media whose parent event is not being restored', () => {
    const { data } = mediaDocument()
    expect(
      check('eventMedia', data, { id: 'media-1', eventId: 'event-missing', data: {} }),
    ).toBe('unknown_event')
  })

  it('rejects media over the per-type size limit', () => {
    const { document, data } = mediaDocument({ sizeBytes: 6 * 1024 * 1024 })
    expect(check('eventMedia', data, document)).toBe('invalid_media')
  })

  it('rejects media with an unsupported file extension', () => {
    const { document, data } = mediaDocument({
      storagePath: 'users/user-ze/events/event-1/media/media-1.gif',
    })
    expect(check('eventMedia', data, document)).toBe('invalid_media')
  })

  it('skips validation for the user profile', () => {
    expect(check('userProfile', { appLanguage: 'pt' }, { id: 'user-ze', data: {} })).toBeNull()
  })
})

describe('sanitizeProfileForRestore', () => {
  const profile = {
    name: 'Zé Ninguém',
    email: 'ze@example.test',
    appLanguage: 'pt',
    notificationsEnabled: true,
    accountStatus: 'approved',
    approvedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
    approvedBy: 'admin',
    rejectedAt: null,
    fcmTokens: ['token-1'],
  }

  it('always drops the server-owned and credential fields', () => {
    const sanitized = sanitizeProfileForRestore(profile, { crossAccount: false })

    expect(sanitized).toEqual({
      name: 'Zé Ninguém',
      email: 'ze@example.test',
      appLanguage: 'pt',
      notificationsEnabled: true,
    })
  })

  it('also drops identity fields when restoring into another account', () => {
    const sanitized = sanitizeProfileForRestore(profile, { crossAccount: true })

    expect(sanitized).toEqual({ appLanguage: 'pt', notificationsEnabled: true })
  })
})
