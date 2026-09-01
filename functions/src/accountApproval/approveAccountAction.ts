import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { onRequest } from 'firebase-functions/v2/https'
import type { AppLanguage } from '../shared/account/types.js'
import { resolveEffectiveAccountStatus } from '../shared/account/types.js'
import { verifyApprovalToken } from '../email/approvalToken.js'
import { buildActionResultPage } from '../email/templates.js'
import { httpFunctionOptions } from '../functionOptions.js'
import {
  getAppPublicUrl,
  getApprovalTokenSecret,
  getInstanceName,
  isAccountApprovalRequired,
} from './config.js'
import { notifyUserApproved, notifyUserRejected } from './notifications.js'

function ensureAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp()
  }
}

function htmlResponse(res: { status: (code: number) => { send: (body: string) => void } }, status: number, html: string): void {
  res.status(status).send(html)
}

export const accountApprovalAction = onRequest(httpFunctionOptions(), async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed')
    return
  }

  const appPublicUrl = getAppPublicUrl() ?? 'https://example.invalid'
  const instanceName = getInstanceName()

  if (!isAccountApprovalRequired()) {
    htmlResponse(
      res,
      404,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action: 'approve',
        success: false,
        message: 'Account approval is not enabled on this instance.',
      }),
    )
    return
  }

  const token = typeof req.query.token === 'string' ? req.query.token : ''
  const tokenSecret = getApprovalTokenSecret()
  if (!token || !tokenSecret) {
    htmlResponse(
      res,
      400,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action: 'approve',
        success: false,
        message: 'Missing or invalid approval link.',
      }),
    )
    return
  }

  let uid: string
  let action: 'approve' | 'reject'
  try {
    ;({ uid, action } = verifyApprovalToken(tokenSecret, token))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid approval link.'
    htmlResponse(
      res,
      400,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action: 'approve',
        success: false,
        message,
      }),
    )
    return
  }

  ensureAdminApp()
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    htmlResponse(
      res,
      404,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action,
        success: false,
        message: 'User profile not found.',
      }),
    )
    return
  }

  const data = snapshot.data() ?? {}
  const status = resolveEffectiveAccountStatus(data)
  if (status !== 'pending') {
    htmlResponse(
      res,
      409,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action,
        success: false,
        message: 'This account is no longer pending approval.',
      }),
    )
    return
  }

  const userEmail = typeof data.email === 'string' ? data.email : ''
  const appLanguage = data.appLanguage as AppLanguage | undefined
  // The signed link carries the account and the action, never who clicked it, so
  // naming an admin here would be a guess. Record the mechanism instead.
  const decidedBy = 'approval-link'

  if (action === 'approve') {
    await userRef.update({
      accountStatus: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: decidedBy,
      updatedAt: FieldValue.serverTimestamp(),
    })

    try {
      await notifyUserApproved({ email: userEmail, registrationLocale: appLanguage })
    } catch (error) {
      console.error('Failed to send user approved email:', error)
    }

    htmlResponse(
      res,
      200,
      buildActionResultPage({
        instanceName,
        appPublicUrl,
        action,
        success: true,
        message: 'The account was approved. The user has been notified by email.',
      }),
    )
    return
  }

  await userRef.update({
    accountStatus: 'rejected',
    rejectedAt: FieldValue.serverTimestamp(),
    approvedBy: decidedBy,
    updatedAt: FieldValue.serverTimestamp(),
  })

  try {
    await notifyUserRejected({ email: userEmail, registrationLocale: appLanguage })
  } catch (error) {
    console.error('Failed to send user rejected email:', error)
  }

  htmlResponse(
    res,
    200,
    buildActionResultPage({
      instanceName,
      appPublicUrl,
      action,
      success: true,
      message: 'The account was rejected. The user has been notified by email.',
    }),
  )
})
