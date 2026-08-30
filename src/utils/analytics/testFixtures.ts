import type { Event } from '../../types/Event'

/** Fábrica partilhada pelos testes de análise. Nomes fictícios, sem PII. */
export function makeEvent(
  overrides: Partial<Event> & Pick<Event, 'id' | 'date' | 'eventType'>,
): Event {
  const now = new Date(2026, 0, 1)
  return {
    userId: 'u1',
    name: `Prova ${overrides.id}`,
    realDistance: 10,
    location: 'Lisboa',
    status: 'completed',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
