/**
 * Why a sign-in was refused, out of the error the SDK hands over.
 *
 * A blocking function's `HttpsError` reaches the browser wrapped in an
 * `auth/internal-error` whose message carries the original text somewhere
 * inside it. So the reason travels as a token, and this is the one place that
 * knows the tokens. Both sides import this file, which is what keeps them from
 * drifting.
 */
export const SIGN_IN_REFUSALS = {
  pending: 'ACCOUNT_PENDING_APPROVAL',
  rejected: 'ACCOUNT_REJECTED',
} as const

export type SignInRefusal = keyof typeof SIGN_IN_REFUSALS | 'generic'

export function describeSignInRefusal(error: unknown): SignInRefusal {
  const message =
    error instanceof Error
      ? `${error.message}`
      : typeof error === 'string'
        ? error
        : ''

  if (message.includes(SIGN_IN_REFUSALS.pending)) return 'pending'
  if (message.includes(SIGN_IN_REFUSALS.rejected)) return 'rejected'
  return 'generic'
}
