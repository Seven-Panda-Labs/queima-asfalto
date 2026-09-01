#!/usr/bin/env npx tsx
/**
 * Grants or revokes the admin flag on an account, by email.
 *
 * The app deliberately has no way to do this: no privileged surface hands out
 * privilege, so the role is set by whoever already holds the project credentials.
 * This script is that person with a shorter path than the console, not a new
 * authority.
 *
 * The account has to exist, which means the person has signed in at least once.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run admin:grant -- --email you@example.com --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run admin:grant -- --email you@example.com --dry-run
 *   npm run admin:grant -- --email you@example.com --confirm
 *   npm run admin:grant -- --email you@example.com --revoke --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')
const revoke = process.argv.includes('--revoke')
const emailIndex = process.argv.indexOf('--email')
const email = emailIndex === -1 ? null : process.argv[emailIndex + 1]?.trim().toLowerCase()

if (!email || !email.includes('@')) {
  console.error('Refusing to run. Pass --email <address>.')
  process.exit(1)
}

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

console.log(`Target project: ${PROJECT_ID}`)
console.log(`Account: ${email}`)
console.log(`Action: ${revoke ? 'revoke admin' : 'grant admin'}`)
console.log(`Mode: ${dryRun ? 'dry run' : 'write'}`)

const matches = await db.collection('users').where('email', '==', email).get()

if (matches.empty) {
  console.error(
    `\nNo account with that email. The person has to sign in once before they exist as a user.`,
  )
  process.exit(1)
}

if (matches.size > 1) {
  console.error(`\n${matches.size} accounts share that email. Refusing to guess.`)
  process.exit(1)
}

const [document] = matches.docs
const data = document.data()
console.log(`\nFound ${document.id}: admin=${data.admin === true}, status=${data.accountStatus}`)

// An admin who cannot use the app is not an admin: the rules gate every read on
// the account being approved, so granting the flag without approving is a trap.
const shouldApprove = !revoke && data.accountStatus !== 'approved'
if (shouldApprove) {
  console.log('Account is not approved, so this also approves it.')
}

if (dryRun) {
  console.log('\nDry run, nothing written.')
  process.exit(0)
}

await document.ref.update({
  admin: !revoke,
  ...(shouldApprove
    ? { accountStatus: 'approved', approvedAt: FieldValue.serverTimestamp() }
    : {}),
  updatedAt: FieldValue.serverTimestamp(),
})

console.log(`\nDone. ${revoke ? 'Revoked' : 'Granted'} admin on ${document.id}.`)
