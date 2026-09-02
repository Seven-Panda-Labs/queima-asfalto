import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  beforeUserCreated,
  beforeUserSignedIn,
  HttpsError,
} from 'firebase-functions/v2/identity'
import type { AccountStatus } from '../shared/account/types.js'
import { parseRegistrationLocale, resolveEffectiveAccountStatus } from '../shared/account/types.js'
import { SIGN_IN_REFUSALS } from '../shared/account/signInRefusal.js'
import { blockingFunctionOptions } from '../functionOptions.js'
import { assertAccountApprovalConfig, isAccountApprovalRequired } from './config.js'
import {
  buildInitialUserProfile,
  buildLegacyApprovedUserProfile,
} from './userProfile.js'
import { listAdminEmails } from './admins.js'
import { notifyAdminNewUser } from './notifications.js'

function ensureAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp()
  }
}

const blockingOptions = blockingFunctionOptions()



export const accountApprovalBeforeUserCreated = beforeUserCreated(
  blockingOptions,
  async (event) => {
    if (!isAccountApprovalRequired()) {
      return
    }

    assertAccountApprovalConfig()

    const user = event.data
    if (!user?.uid) {
      return
    }

    ensureAdminApp()
    const db = getFirestore()
    const userRef = db.collection('users').doc(user.uid)
    const existing = await userRef.get()
    if (existing.exists) {
      return
    }

    // Everybody starts pending, the operator included: the old ADMIN_EMAIL
    // auto-approved whoever matched it, and that exception is what the documented
    // first run step replaces.
    const accountStatus: AccountStatus = 'pending'
    const registrationLocale = parseRegistrationLocale(event.locale)

    await userRef.set(
      buildInitialUserProfile({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        accountStatus,
        registrationLocale,
      }),
    )

    if (accountStatus === 'pending') {
      try {
        await notifyAdminNewUser({
          uid: user.uid,
          name: user.displayName ?? '',
          email: user.email ?? '',
          adminEmails: await listAdminEmails(db),
          registrationLocale,
        })
      } catch (error) {
        console.error('Failed to send admin new-user email:', error)
      }
    }
  },
)

export const accountApprovalBeforeUserSignedIn = beforeUserSignedIn(
  blockingOptions,
  async (event) => {
    if (!isAccountApprovalRequired()) {
      return
    }

    assertAccountApprovalConfig()

    const user = event.data
    if (!user?.uid) {
      return
    }

    ensureAdminApp()
    const db = getFirestore()
    const userRef = db.collection('users').doc(user.uid)
    const snapshot = await userRef.get()

    if (!snapshot.exists) {
      const isNewUser = event.additionalUserInfo?.isNewUser === true
      if (isNewUser) {
        throw new HttpsError(
          'internal',
          'User profile is not ready yet. Please try signing in again.',
        )
      }

      await userRef.set(
        buildLegacyApprovedUserProfile({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        }),
      )
      return
    }

    const status = resolveEffectiveAccountStatus(snapshot.data())

    // Refused at the door, not gated inside the app. An account waiting for
    // approval can write nothing, so letting it in only produces a screen that
    // looks broken. The user is emailed the moment it is approved.
    if (status === 'pending') {
      throw new HttpsError('permission-denied', SIGN_IN_REFUSALS.pending)
    }

    if (status === 'rejected') {
      throw new HttpsError('permission-denied', SIGN_IN_REFUSALS.rejected)
    }
  },
)
