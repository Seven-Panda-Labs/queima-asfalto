import type { EventStatus, EventType } from '../src/domain/eventCodes.js'

type PerformanceGoalType = 'pr_target' | 'pace_target' | 'time_target'

export const DEMO_USER_ID = 'sEbl8eWuYtN2Nbnq7DrWE57Vayq2'

export const DEMO_PROFILE = {
  name: 'Inês Exemplo',
  resultFirstName: 'Inês',
  resultLastName: 'Exemplo',
  appLanguage: 'pt' as const,
  favoriteParkrunSlugs: ['monsanto'],
}

type SeedEventBase = {
  date: string
  realDistance: number
  eventType: EventType
  status: EventStatus
  emoji?: string
  notes?: string | null
  time?: string
  classification?: string
  resultsPlatform?: string
  resultsVerified?: boolean
}

/**
 * A race from the catalog. The seed reads the entry from the target project
 * and takes the name, the place and the site from it, so the demo shows what
 * a runner who adds races from discovery sees.
 */
export type SeedRaceEvent = SeedEventBase & { catalogRaceId: string }

/** A parkrun, which the race catalog does not hold on purpose. */
export type SeedParkrunEvent = SeedEventBase & {
  name: string
  location: string
  locationLat: number
  locationLng: number
  parkrunEventSlug: string
  parkrunCountryUrl: string
}

export type SeedEvent = SeedRaceEvent | SeedParkrunEvent

export type SeedGoal = {
  eventType: EventType
  year: number
  targetCount: number
  emoji?: string
  notes?: string | null
}

export type SeedPerformanceGoal = {
  type: PerformanceGoalType
  eventType: EventType
  year: number
  targetPace?: string
  targetTime?: string
  emoji?: string
  notes?: string | null
}

/** A wish is a marker on a race, so all it carries is the race and a note. */
export type SeedBucketListItem = {
  catalogRaceId: string
  notes?: string | null
  recurring?: boolean
}

function parkrun(
  date: string,
  time: string,
  classification: string,
  notes?: string,
): SeedParkrunEvent {
  return {
    name: 'parkrun Monsanto',
    date,
    realDistance: 5,
    eventType: 'km_5',
    location: 'Parque Florestal de Monsanto, Lisboa',
    locationLat: 38.726,
    locationLng: -9.194,
    status: 'completed',
    emoji: '🏃‍♀️',
    time,
    classification,
    resultsPlatform: 'parkrun',
    parkrunEventSlug: 'monsanto',
    parkrunCountryUrl: 'https://www.parkrun.pt',
    resultsVerified: true,
    notes: notes ?? null,
  }
}

/**
 * Fictional runner history (2021 to 2026) over real races from the catalog.
 * Production ids: the seed skips, with a warning, any the target does not hold.
 */
export const DEMO_EVENTS: SeedEvent[] = [
  // 2021: getting started
  {
    catalogRaceId: 'lisbon-10k',
    date: '2021-03-14',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🎯',
    time: '01:04:12',
    classification: '842/2100',
  },
  {
    catalogRaceId: 'meia-maratona-de-faro',
    date: '2021-04-18',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🔥',
    time: '01:02:08',
    classification: '956/3200',
  },
  {
    catalogRaceId: 'pt-peso-da-regua-meia-maratona-do-douro-vinhateiro',
    date: '2021-05-30',
    realDistance: 5,
    eventType: 'km_5',
    status: 'completed',
    emoji: '🍇',
    time: '00:32:45',
    classification: '1205/4800',
  },
  {
    catalogRaceId: 'pt-ovar-meia-maratona-de-ovar',
    date: '2021-10-17',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🌊',
    time: '02:22:40',
    classification: '1842/4500',
    notes: 'Primeira meia maratona.',
  },

  // 2022
  parkrun('2022-01-08', '00:28:42', '118/210'),
  {
    catalogRaceId: 'lisbon-half-marathon',
    date: '2022-03-20',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🏙️',
    time: '02:12:55',
    classification: '1320/9800',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    catalogRaceId: 'pt-9950-302-madalena-do-pico-azores-trail-run',
    date: '2022-05-15',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🌋',
    time: '00:58:20',
    classification: '640/2800',
  },
  parkrun('2022-07-02', '00:27:55', '92/198'),
  {
    catalogRaceId: 'pt-sintra-trail-do-bom-despacho',
    date: '2022-10-16',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '⛰️',
    time: '01:06:30',
    classification: '210/680',
    notes: 'Primeiro trail.',
  },
  {
    catalogRaceId: 'pt-restelo-meia-maratona-dos-descobrimentos',
    date: '2022-11-27',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '⛵',
    time: '02:08:44',
    classification: '980/11200',
    resultsPlatform: 'sporthive',
    resultsVerified: true,
  },
  parkrun('2022-12-10', '00:27:10', '78/205'),

  // 2023
  parkrun('2023-02-04', '00:26:58', '71/192'),
  {
    catalogRaceId: 'pt-cascais-montepio-meia-maratona-de-cascais',
    date: '2023-02-05',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🌉',
    time: '00:54:32',
    classification: '720/6500',
  },
  {
    catalogRaceId: 'pt-peso-da-regua-meia-maratona-do-douro-vinhateiro',
    date: '2023-05-21',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🍷',
    time: '02:05:18',
    classification: '540/3200',
  },
  parkrun('2023-07-15', '00:26:20', '64/188'),
  {
    catalogRaceId: 'valencia-half-marathon',
    date: '2023-10-22',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🍊',
    time: '02:03:05',
    classification: '410/2100',
  },
  {
    catalogRaceId: 'pt-alcochete-corrida-sao-silvestre-de-alcochete',
    date: '2023-12-31',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🎆',
    time: '00:52:18',
    classification: '890/5200',
  },

  // 2024: stronger year
  parkrun('2024-01-13', '00:25:48', '58/176'),
  {
    catalogRaceId: 'lisbon-half-marathon',
    date: '2024-03-17',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🏙️',
    time: '01:58:42',
    classification: '1120/10500',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    catalogRaceId: 'meia-maratona-de-faro',
    date: '2024-04-14',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '⚡',
    time: '00:50:12',
    classification: '312/1800',
  },
  {
    catalogRaceId: 'pt-peso-da-regua-meia-maratona-do-douro-vinhateiro',
    date: '2024-05-26',
    realDistance: 5,
    eventType: 'km_5',
    status: 'completed',
    emoji: '🍇',
    time: '00:27:35',
    classification: '430/3900',
  },
  parkrun('2024-07-20', '00:25:05', '49/182'),
  {
    catalogRaceId: 'pt-massarelos-meia-maratona-do-porto',
    date: '2024-09-15',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🌉',
    time: '01:55:28',
    classification: '680/8900',
    resultsPlatform: 'sporthive',
    resultsVerified: true,
  },
  {
    catalogRaceId: 'pt-alcochete-corrida-sao-silvestre-de-alcochete',
    date: '2024-12-29',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🎄',
    time: '00:49:55',
    classification: '205/1400',
  },

  // 2025: marathon year
  parkrun('2025-01-11', '00:24:38', '42/168'),
  {
    catalogRaceId: 'pt-cascais-montepio-meia-maratona-de-cascais',
    date: '2025-02-09',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🌊',
    time: '01:52:14',
    classification: '520/4100',
  },
  {
    catalogRaceId: 'pt-9950-302-madalena-do-pico-azores-trail-run',
    date: '2025-05-18',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🌋',
    time: '00:48:22',
    classification: '188/2600',
  },
  parkrun('2025-06-28', '00:24:05', '35/174'),
  {
    catalogRaceId: 'pt-porto-edp-maratona-do-porto',
    date: '2025-11-02',
    realDistance: 42.2,
    eventType: 'km_42_2',
    status: 'completed',
    emoji: '🏅',
    time: '04:12:36',
    classification: '1240/6800',
    resultsPlatform: 'mikatiming',
    resultsVerified: true,
    notes: 'Primeira maratona.',
  },
  {
    catalogRaceId: 'pt-alcochete-corrida-sao-silvestre-de-alcochete',
    date: '2025-12-31',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '🎆',
    time: '00:47:58',
    classification: '410/5800',
  },

  // 2026: current season
  parkrun('2026-01-10', '00:23:52', '31/162'),
  {
    catalogRaceId: 'lisbon-half-marathon',
    date: '2026-03-15',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'completed',
    emoji: '🏙️',
    time: '01:50:05',
    classification: '890/10200',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    catalogRaceId: 'meia-maratona-de-faro',
    date: '2026-04-19',
    realDistance: 10,
    eventType: 'km_10',
    status: 'completed',
    emoji: '⚡',
    time: '00:47:12',
    classification: '298/6100',
  },
  {
    catalogRaceId: 'pt-ovar-meia-maratona-de-ovar',
    date: '2026-10-25',
    realDistance: 21.1,
    eventType: 'km_21_1',
    status: 'confirmed',
    emoji: '🌊',
    notes: 'Hotel já reservado.',
  },
  {
    catalogRaceId: 'pt-porto-edp-maratona-do-porto',
    date: '2026-11-08',
    realDistance: 42.2,
    eventType: 'km_42_2',
    status: 'planned',
    emoji: '🎯',
    notes: 'Objectivo sub-4h.',
  },
  {
    catalogRaceId: 'pt-alcochete-corrida-sao-silvestre-de-alcochete',
    date: '2026-12-31',
    realDistance: 10,
    eventType: 'km_10',
    status: 'planned',
    emoji: '🎄',
  },
]

export const DEMO_GOALS: SeedGoal[] = [
  { eventType: 'km_10', year: 2024, targetCount: 4, emoji: '🎯', notes: null },
  { eventType: 'km_21_1', year: 2024, targetCount: 2, emoji: '🌊', notes: null },
  { eventType: 'km_10', year: 2025, targetCount: 5, emoji: '⚡', notes: null },
  { eventType: 'km_21_1', year: 2025, targetCount: 2, emoji: '🏙️', notes: null },
  { eventType: 'km_42_2', year: 2025, targetCount: 1, emoji: '🏅', notes: 'Primeira maratona.' },
  { eventType: 'km_10', year: 2026, targetCount: 6, emoji: '🎯', notes: null },
  { eventType: 'km_21_1', year: 2026, targetCount: 2, emoji: '🍷', notes: null },
  { eventType: 'km_42_2', year: 2026, targetCount: 1, emoji: '🌉', notes: 'Sub-4h.' },
]

export const DEMO_PERFORMANCE_GOALS: SeedPerformanceGoal[] = [
  {
    type: 'pace_target',
    eventType: 'km_10',
    year: 2024,
    targetPace: '5:30',
    emoji: '📈',
    notes: null,
  },
  {
    type: 'time_target',
    eventType: 'km_21_1',
    year: 2025,
    targetTime: '01:55:00',
    emoji: '⏱️',
    notes: null,
  },
  {
    type: 'pr_target',
    eventType: 'km_5',
    year: 2025,
    emoji: '🏃‍♀️',
    notes: 'Melhor tempo em parkrun.',
  },
  {
    type: 'pace_target',
    eventType: 'km_10',
    year: 2026,
    targetPace: '4:45',
    emoji: '⚡',
    notes: null,
  },
  {
    type: 'time_target',
    eventType: 'km_21_1',
    year: 2026,
    targetTime: '01:48:00',
    emoji: '🍷',
    notes: 'Meia de Ovar.',
  },
  {
    type: 'time_target',
    eventType: 'km_42_2',
    year: 2026,
    targetTime: '03:55:00',
    emoji: '🏅',
    notes: 'Maratona do Porto.',
  },
]

export const DEMO_BUCKET_LIST: SeedBucketListItem[] = [
  // A copy in production, folded into the GENERALI BERLIN-MARATHON: the seed follows it.
  { catalogRaceId: 'berlin-marathon', notes: 'A maratona mais rápida do mundo.' },
  { catalogRaceId: 'tokyo-marathon', notes: 'Sorteio todos os anos, um dia calha.', recurring: true },
  { catalogRaceId: 'london-marathon', notes: 'Sonho de longo prazo.' },
  { catalogRaceId: 'gb-newcastle-upon-tyne-great-north-run' },
  { catalogRaceId: 'copenhagen-half-marathon' },
]
