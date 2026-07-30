import { HttpsError } from 'firebase-functions/v2/https'
import type { Firestore } from 'firebase-admin/firestore'
import { resolveEffectiveAccountStatus } from '../shared/account/types.js'
import { isAccountApprovalRequired } from './config.js'

export async function requireApprovedAccount(db: Firestore, uid: string): Promise<void> {
  if (!isAccountApprovalRequired()) {
    return
  }

  const snapshot = await db.collection('users').doc(uid).get()
  const status = resolveEffectiveAccountStatus(snapshot.data())

  if (status === 'pending') {
    throw new HttpsError(
      'permission-denied',
      'Account is pending administrator approval.',
    )
  }

  if (status === 'rejected') {
    throw new HttpsError('permission-denied', 'Account access was rejected.')
  }
}
