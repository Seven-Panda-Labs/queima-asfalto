import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import type { AccountStatus, AppLanguage } from './shared/account/types.js'
import { resolveEffectiveAccountStatus } from './shared/account/types.js'
import { callableFunctionOptions } from './functionOptions.js'
import { notifyUserApproved, notifyUserRejected } from './accountApproval/notifications.js'

const USERS_COLLECTION = 'users'

/**
 * How many accounts one call returns.
 *
 * An instance is a handful of people, so there is no paging: a cap that is
 * obviously above any real instance keeps a runaway query from being possible at
 * all, and the response says when it was hit.
 */
const MAX_USERS = 500

const callableOptions = callableFunctionOptions()

type AdminUser = {
  uid: string
  name: string
  email: string
  accountStatus: AccountStatus
  admin: boolean
  createdAt: string | null
  appLanguage?: AppLanguage
}

function timestampToIso(value: unknown): string | null {
  const timestamp = value as Timestamp | undefined
  return timestamp?.toDate ? timestamp.toDate().toISOString() : null
}

/**
 * The caller, if they are an operator.
 *
 * The flag is read from Firestore rather than from a custom claim, so revoking it
 * in the console takes effect on the next call instead of on the next token
 * refresh.
 */
async function requireAdmin(
  request: { auth?: { uid?: string } },
  db: Firestore,
): Promise<string> {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }

  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get()
  if (snapshot.data()?.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrator access required.')
  }

  return uid
}

function requireUid(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'A user id is required.')
  }
  return value.trim()
}

/**
 * Every account, with the fields a decision about it needs and nothing else.
 *
 * A callable rather than a query, because the rules let a user read only their own
 * document, and that stays true: names and emails are read here, server side, by
 * someone who is already an operator.
 */
export const adminListUsers = onCall(callableOptions, async (request) => {
  const db = getFirestore()
  await requireAdmin(request, db)

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(MAX_USERS + 1)
    .get()

  const users: AdminUser[] = snapshot.docs.slice(0, MAX_USERS).map((document) => {
    const data = document.data() ?? {}
    return {
      uid: document.id,
      name: typeof data.name === 'string' ? data.name : '',
      email: typeof data.email === 'string' ? data.email : '',
      accountStatus: resolveEffectiveAccountStatus(data),
      admin: data.admin === true,
      createdAt: timestampToIso(data.createdAt),
      appLanguage: data.appLanguage as AppLanguage | undefined,
    }
  })

  return { users, truncated: snapshot.size > MAX_USERS }
})

/**
 * Approve or block an account.
 *
 * Blocking is `rejected`, the status the rules already deny and the app already
 * has a screen for, so un-approving and blocking are one operation. It never
 * touches `admin`: the role is set in the console, on purpose, so that no
 * privileged surface can hand out privilege.
 */
export const adminSetAccountStatus = onCall(callableOptions, async (request) => {
  const db = getFirestore()
  const callerUid = await requireAdmin(request, db)

  const targetUid = requireUid((request.data as { uid?: unknown })?.uid)
  const status = (request.data as { status?: unknown })?.status
  if (status !== 'approved' && status !== 'rejected') {
    throw new HttpsError('invalid-argument', 'Status must be approved or rejected.')
  }

  // An operator blocking themselves locks the instance out of its own admin, and
  // the way back is the console. Refusing is cheaper than explaining.
  if (targetUid === callerUid) {
    throw new HttpsError('failed-precondition', 'An administrator cannot change their own status.')
  }

  const targetRef = db.collection(USERS_COLLECTION).doc(targetUid)
  const target = await targetRef.get()
  if (!target.exists) {
    throw new HttpsError('not-found', 'No such account.')
  }

  const data = target.data() ?? {}
  const previous = resolveEffectiveAccountStatus(data)
  if (previous === status) {
    return { uid: targetUid, accountStatus: status, changed: false }
  }

  await targetRef.update(
    status === 'approved'
      ? {
          accountStatus: 'approved',
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: callerUid,
          updatedAt: FieldValue.serverTimestamp(),
        }
      : {
          accountStatus: 'rejected',
          rejectedAt: FieldValue.serverTimestamp(),
          approvedBy: callerUid,
          updatedAt: FieldValue.serverTimestamp(),
        },
  )

  // The same mail the approval link sends, so the two paths look identical from
  // the outside.
  const email = typeof data.email === 'string' ? data.email : ''
  const language = data.appLanguage as AppLanguage | undefined
  if (email) {
    try {
      await (status === 'approved'
        ? notifyUserApproved({ email, registrationLocale: language })
        : notifyUserRejected({ email, registrationLocale: language }))
    } catch (error) {
      console.error('Failed to send account status email:', error)
    }
  }

  return { uid: targetUid, accountStatus: status, changed: true }
})
