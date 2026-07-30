import { createHmac, timingSafeEqual } from 'node:crypto'

export type ApprovalAction = 'approve' | 'reject'

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function createApprovalToken(
  secret: string,
  uid: string,
  action: ApprovalAction,
  nowMs = Date.now(),
): string {
  const exp = nowMs + TOKEN_TTL_MS
  const payload = `${uid}.${action}.${exp}`
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${base64UrlEncode(payload)}.${signature}`
}

export function verifyApprovalToken(
  secret: string,
  token: string,
  nowMs = Date.now(),
): { uid: string; action: ApprovalAction } {
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('Invalid token format.')
  }

  const [encodedPayload, signature] = parts
  const payload = base64UrlDecode(encodedPayload)
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature.')
  }

  const segments = payload.split('.')
  if (segments.length !== 3) {
    throw new Error('Invalid token payload.')
  }

  const [uid, action, expRaw] = segments
  if (!uid || (action !== 'approve' && action !== 'reject')) {
    throw new Error('Invalid token action.')
  }

  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp < nowMs) {
    throw new Error('Token expired.')
  }

  return { uid, action }
}
