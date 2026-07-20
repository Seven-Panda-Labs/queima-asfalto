import type { CallableOptions } from 'firebase-functions/v2/https'
import type { ScheduleOptions } from 'firebase-functions/v2/scheduler'

const DEFAULT_REGION = 'europe-west1'
const DEFAULT_SCHEDULER_TIMEZONE = 'Europe/Lisbon'

/** Light Firestore callables (shares). Caps runaway scaling on small/self-hosted projects. */
const CALLABLE_MAX_INSTANCES = 20
const CALLABLE_CONCURRENCY = 40

/** External HTTP scraping — keep parallel load low (complements per-user rate limit). */
export const LOOKUP_CALLABLE_MAX_INSTANCES = 5
export const LOOKUP_CALLABLE_CONCURRENCY = 1

/** Scheduled batch job — avoid overlapping cron invocations. */
export const SCHEDULER_MAX_INSTANCES = 1
export const SCHEDULER_CONCURRENCY = 1
export const SCHEDULER_TIMEOUT_SECONDS = 300

function resolveRegion(): string {
  return process.env.FUNCTIONS_REGION?.trim() || DEFAULT_REGION
}

function resolveServiceAccount(): string | undefined {
  const value = process.env.FUNCTIONS_SERVICE_ACCOUNT?.trim()
  return value || undefined
}

export function callableFunctionOptions(overrides: Partial<CallableOptions> = {}): CallableOptions {
  const options: CallableOptions = {
    region: resolveRegion(),
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: CALLABLE_MAX_INSTANCES,
    concurrency: CALLABLE_CONCURRENCY,
    invoker: 'public',
    ...overrides,
  }

  const serviceAccount = resolveServiceAccount()
  if (serviceAccount) {
    options.serviceAccount = serviceAccount
  }

  return options
}

export function scheduleFunctionOptions(
  schedule: string,
  overrides: Omit<Partial<ScheduleOptions>, 'schedule'> = {},
): ScheduleOptions {
  const timeZone =
    process.env.SCHEDULER_TIMEZONE?.trim() || DEFAULT_SCHEDULER_TIMEZONE

  return {
    region: resolveRegion(),
    timeZone,
    schedule,
    maxInstances: SCHEDULER_MAX_INSTANCES,
    concurrency: SCHEDULER_CONCURRENCY,
    timeoutSeconds: SCHEDULER_TIMEOUT_SECONDS,
    ...overrides,
  }
}
