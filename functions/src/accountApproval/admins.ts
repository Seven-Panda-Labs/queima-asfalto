import type { Firestore } from 'firebase-admin/firestore'

/**
 * The email addresses of the instance operators.
 *
 * Replaces the old `ADMIN_EMAIL` variable, which existed only because there was
 * no way to designate an admin user. Now the flag on the user document is the
 * single definition, and the approval mail goes wherever it points.
 *
 * An empty list is not an error: a fresh instance has no admin until the first
 * account is promoted through the console, and the caller skips the mail exactly
 * as it did when the variable was unset.
 */
export async function listAdminEmails(db: Firestore): Promise<string[]> {
  const snapshot = await db.collection('users').where('admin', '==', true).get()

  const emails = snapshot.docs
    .map((document) => document.data()?.email)
    .filter((email): email is string => typeof email === 'string' && email.includes('@'))
    .map((email) => email.trim().toLowerCase())

  return [...new Set(emails)]
}
