import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  beforeUserCreated,
  beforeUserSignedIn,
  HttpsError,
} from 'firebase-functions/v2/identity'
import { parseRegistrationLocale, resolveEffectiveAccountStatus } from '../shared/account/types.js'
import { blockingFunctionOptions } from '../functionOptions.js'
import {
  assertAccountApprovalConfig,
  getAdminEmail,
  isAccountApprovalRequired,
} from './config.js'
import {
  buildInitialUserProfile,
  buildLegacyApprovedUserProfile,
  resolveInitialAccountStatus,
} from './userProfile.js'

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

    const adminEmail = getAdminEmail()
    const accountStatus = resolveInitialAccountStatus(user.email, adminEmail)
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

    if (status === 'rejected') {
      throw new HttpsError(
        'permission-denied',
        'This account was not approved. Contact the site administrator.',
      )
    }
  },
)
