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

export type SeedEvent = {
  name: string
  date: string
  realDistance: number
  eventType: EventType
  location: string
  locationLat?: number
  locationLng?: number
  status: EventStatus
  emoji?: string
  notes?: string | null
  time?: string
  classification?: string
  resultsPlatform?: string
  parkrunEventSlug?: string
  parkrunCountryUrl?: string
  resultsVerified?: boolean
}

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

export type SeedBucketListItem = {
  name: string
  location: string
  realDistance: number
  disciplines: EventType[]
  targetMonth?: string
  link?: string
  emoji?: string
  notes?: string | null
  locationLat?: number
  locationLng?: number
}

function parkrun(
  date: string,
  time: string,
  classification: string,
  notes?: string,
): SeedEvent {
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

/** Fictional runner history (2021–2026) with real Portuguese race names. */
export const DEMO_EVENTS: SeedEvent[] = [
  // 2021 — getting started
  {
    name: 'Corrida da Cidade de Almada',
    date: '2021-03-14',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Almada',
    locationLat: 38.68,
    locationLng: -9.16,
    status: 'completed',
    emoji: '🎯',
    time: '01:04:12',
    classification: '842/2100',
  },
  {
    name: 'Corrida da Mulher — Lisboa',
    date: '2021-05-09',
    realDistance: 5,
    eventType: 'km_5',
    location: 'Parque Eduardo VII, Lisboa',
    locationLat: 38.727,
    locationLng: -9.15,
    status: 'completed',
    emoji: '💜',
    time: '00:32:45',
    classification: '1205/4800',
  },
  {
    name: 'Corrida Internacional de São João',
    date: '2021-06-20',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Porto',
    locationLat: 41.15,
    locationLng: -8.61,
    status: 'completed',
    emoji: '🔥',
    time: '01:02:08',
    classification: '956/3200',
  },
  {
    name: 'Meia Maratona de Cascais',
    date: '2021-10-17',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Cascais',
    locationLat: 38.7,
    locationLng: -9.42,
    status: 'completed',
    emoji: '🌊',
    time: '02:22:40',
    classification: '1842/4500',
    notes: 'Primeira meia maratona.',
  },

  // 2022
  parkrun('2022-01-08', '00:28:42', '118/210'),
  {
    name: 'Meia Maratona de Lisboa',
    date: '2022-03-20',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Lisboa',
    locationLat: 38.72,
    locationLng: -9.14,
    status: 'completed',
    emoji: '🏙️',
    time: '02:12:55',
    classification: '1320/9800',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    name: 'Corrida Montepio — 10K',
    date: '2022-05-15',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.74,
    locationLng: -9.16,
    status: 'completed',
    emoji: '🏦',
    time: '00:58:20',
    classification: '640/2800',
  },
  parkrun('2022-07-02', '00:27:55', '92/198'),
  {
    name: 'Trail da Arrábida — Curto',
    date: '2022-09-18',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Setúbal',
    locationLat: 38.52,
    locationLng: -8.9,
    status: 'completed',
    emoji: '⛰️',
    time: '01:06:30',
    classification: '210/680',
    notes: 'Primeiro trail.',
  },
  {
    name: 'Vodafone mini-maratona de Lisboa',
    date: '2022-11-06',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Lisboa',
    locationLat: 38.72,
    locationLng: -9.14,
    status: 'completed',
    emoji: '📱',
    time: '02:08:44',
    classification: '980/11200',
    resultsPlatform: 'sporthive',
    resultsVerified: true,
  },
  parkrun('2022-12-10', '00:27:10', '78/205'),

  // 2023
  parkrun('2023-02-04', '00:26:58', '71/192'),
  {
    name: 'Meia Maratona do Douro',
    date: '2023-04-02',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Peso da Régua',
    locationLat: 41.16,
    locationLng: -7.79,
    status: 'completed',
    emoji: '🍷',
    time: '02:05:18',
    classification: '540/3200',
  },
  {
    name: 'Corrida da Ponte 25 de Abril',
    date: '2023-05-28',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.69,
    locationLng: -9.17,
    status: 'completed',
    emoji: '🌉',
    time: '00:54:32',
    classification: '720/6500',
  },
  parkrun('2023-07-15', '00:26:20', '64/188'),
  {
    name: 'Meia Maratona de Braga',
    date: '2023-09-24',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Braga',
    locationLat: 41.55,
    locationLng: -8.43,
    status: 'completed',
    emoji: '🏛️',
    time: '02:03:05',
    classification: '410/2100',
  },
  {
    name: 'Corrida São Silvestre de Lisboa',
    date: '2023-12-31',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.71,
    locationLng: -9.14,
    status: 'completed',
    emoji: '🎆',
    time: '00:52:18',
    classification: '890/5200',
  },

  // 2024 — stronger year
  parkrun('2024-01-13', '00:25:48', '58/176'),
  {
    name: 'Meia Maratona de Lisboa',
    date: '2024-03-17',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Lisboa',
    locationLat: 38.72,
    locationLng: -9.14,
    status: 'completed',
    emoji: '🏙️',
    time: '01:58:42',
    classification: '1120/10500',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    name: 'Corrida da Mulher — Porto',
    date: '2024-05-12',
    realDistance: 5,
    eventType: 'km_5',
    location: 'Porto',
    locationLat: 41.15,
    locationLng: -8.61,
    status: 'completed',
    emoji: '💜',
    time: '00:27:35',
    classification: '430/3900',
  },
  {
    name: 'Algés 10K',
    date: '2024-06-09',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Algés',
    locationLat: 38.7,
    locationLng: -9.23,
    status: 'completed',
    emoji: '⚡',
    time: '00:50:12',
    classification: '312/1800',
  },
  parkrun('2024-07-20', '00:25:05', '49/182'),
  {
    name: 'Meia Maratona do Porto',
    date: '2024-11-03',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Porto',
    locationLat: 41.15,
    locationLng: -8.61,
    status: 'completed',
    emoji: '🌉',
    time: '01:55:28',
    classification: '680/8900',
    resultsPlatform: 'sporthive',
    resultsVerified: true,
  },
  {
    name: 'Corrida de Natal — Belém',
    date: '2024-12-15',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Belém, Lisboa',
    locationLat: 38.7,
    locationLng: -9.21,
    status: 'completed',
    emoji: '🎄',
    time: '00:49:55',
    classification: '205/1400',
  },

  // 2025 — marathon year
  parkrun('2025-01-11', '00:24:38', '42/168'),
  {
    name: 'Meia Maratona de Cascais',
    date: '2025-03-09',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Cascais',
    locationLat: 38.7,
    locationLng: -9.42,
    status: 'completed',
    emoji: '🌊',
    time: '01:52:14',
    classification: '520/4100',
  },
  {
    name: 'Corrida Montepio — 10K',
    date: '2025-05-18',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.74,
    locationLng: -9.16,
    status: 'completed',
    emoji: '🏦',
    time: '00:48:22',
    classification: '188/2600',
  },
  parkrun('2025-06-28', '00:24:05', '35/174'),
  {
    name: 'EDP Maratona do Porto',
    date: '2025-11-02',
    realDistance: 42.2,
    eventType: 'km_42_2',
    location: 'Porto',
    locationLat: 41.15,
    locationLng: -8.61,
    status: 'completed',
    emoji: '🏅',
    time: '04:12:36',
    classification: '1240/6800',
    resultsPlatform: 'mikatiming',
    resultsVerified: true,
    notes: 'Primeira maratona.',
  },
  {
    name: 'Corrida São Silvestre de Lisboa',
    date: '2025-12-31',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.71,
    locationLng: -9.14,
    status: 'completed',
    emoji: '🎆',
    time: '00:47:58',
    classification: '410/5800',
  },

  // 2026 — current season
  parkrun('2026-01-10', '00:23:52', '31/162'),
  {
    name: 'Meia Maratona de Lisboa',
    date: '2026-03-15',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Lisboa',
    locationLat: 38.72,
    locationLng: -9.14,
    status: 'completed',
    emoji: '🏙️',
    time: '01:50:05',
    classification: '890/10200',
    resultsPlatform: 'eqtiming',
    resultsVerified: true,
  },
  {
    name: 'Corrida da Ponte 25 de Abril',
    date: '2026-05-25',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    locationLat: 38.69,
    locationLng: -9.17,
    status: 'completed',
    emoji: '🌉',
    time: '00:47:12',
    classification: '298/6100',
  },
  {
    name: 'Meia Maratona do Douro',
    date: '2026-09-06',
    realDistance: 21.1,
    eventType: 'km_21_1',
    location: 'Peso da Régua',
    locationLat: 41.16,
    locationLng: -7.79,
    status: 'confirmed',
    emoji: '🍷',
    notes: 'Hotel já reservado.',
  },
  {
    name: 'EDP Maratona do Porto',
    date: '2026-11-01',
    realDistance: 42.2,
    eventType: 'km_42_2',
    location: 'Porto',
    locationLat: 41.15,
    locationLng: -8.61,
    status: 'planned',
    emoji: '🎯',
    notes: 'Objectivo sub-4h.',
  },
  {
    name: 'Corrida de Natal — Belém',
    date: '2026-12-13',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Belém, Lisboa',
    locationLat: 38.7,
    locationLng: -9.21,
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
    notes: 'Meia do Douro.',
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
  {
    name: 'Maratona de Berlim',
    location: 'Berlim, Alemanha',
    realDistance: 42.2,
    disciplines: ['km_42_2'],
    targetMonth: 'September',
    link: 'https://www.bmw-berlin-marathon.com',
    emoji: '🐻',
    locationLat: 52.52,
    locationLng: 13.4,
  },
  {
    name: 'Comrades Marathon',
    location: 'KwaZulu-Natal, África do Sul',
    realDistance: 89,
    disciplines: ['km_42_2'],
    targetMonth: 'June',
    emoji: '🌍',
    notes: 'Ultra clássica — sonho de longo prazo.',
    locationLat: -29.6,
    locationLng: 30.38,
  },
  {
    name: 'UTMB — CCC',
    location: 'Chamonix, França',
    realDistance: 101,
    disciplines: ['km_42_2'],
    targetMonth: 'August',
    emoji: '⛰️',
    notes: 'Trail de montanha.',
    locationLat: 45.92,
    locationLng: 6.87,
  },
  {
    name: 'Great North Run',
    location: 'Newcastle, Reino Unido',
    realDistance: 21.1,
    disciplines: ['km_21_1'],
    targetMonth: 'September',
    link: 'https://www.greatrun.org/great-north-run',
    emoji: '🇬🇧',
    locationLat: 54.98,
    locationLng: -1.61,
  },
  {
    name: 'São Silvestre de Porto',
    location: 'Porto',
    realDistance: 10,
    disciplines: ['km_10'],
    targetMonth: 'December',
    emoji: '🎆',
    locationLat: 41.15,
    locationLng: -8.61,
  },
]
