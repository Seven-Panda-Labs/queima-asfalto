import { afterEach, describe, expect, it } from 'vitest'
import {
  LOOKUP_CALLABLE_CONCURRENCY,
  LOOKUP_CALLABLE_MAX_INSTANCES,
  SCHEDULER_CONCURRENCY,
  SCHEDULER_MAX_INSTANCES,
  SCHEDULER_TIMEOUT_SECONDS,
  callableFunctionOptions,
  scheduleFunctionOptions,
} from './functionOptions.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('callableFunctionOptions', () => {
  it('applies default scaling limits for share callables', () => {
    const options = callableFunctionOptions()

    expect(options.maxInstances).toBe(20)
    expect(options.concurrency).toBe(40)
    expect(options.timeoutSeconds).toBe(60)
    expect(options.memory).toBe('256MiB')
    expect(options.invoker).toBe('public')
  })

  it('allows per-function overrides', () => {
    const options = callableFunctionOptions({
      maxInstances: LOOKUP_CALLABLE_MAX_INSTANCES,
      concurrency: LOOKUP_CALLABLE_CONCURRENCY,
    })

    expect(options.maxInstances).toBe(5)
    expect(options.concurrency).toBe(1)
  })

  it('reads region and service account from env', () => {
    process.env.FUNCTIONS_REGION = 'us-central1'
    process.env.FUNCTIONS_SERVICE_ACCOUNT = 'cf@example.com'

    const options = callableFunctionOptions()

    expect(options.region).toBe('us-central1')
    expect(options.serviceAccount).toBe('cf@example.com')
  })
})

describe('scheduleFunctionOptions', () => {
  it('limits scheduler to a single concurrent instance', () => {
    const options = scheduleFunctionOptions('every 60 minutes')

    expect(options.schedule).toBe('every 60 minutes')
    expect(options.maxInstances).toBe(SCHEDULER_MAX_INSTANCES)
    expect(options.concurrency).toBe(SCHEDULER_CONCURRENCY)
    expect(options.timeoutSeconds).toBe(SCHEDULER_TIMEOUT_SECONDS)
    expect(options.timeZone).toBe('Europe/Lisbon')
  })

  it('reads scheduler timezone from env', () => {
    process.env.SCHEDULER_TIMEZONE = 'America/New_York'

    const options = scheduleFunctionOptions('every 60 minutes')

    expect(options.timeZone).toBe('America/New_York')
  })
})
