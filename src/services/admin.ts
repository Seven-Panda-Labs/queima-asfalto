import { httpsCallable } from 'firebase/functions'
import type { AccountStatus } from '../../shared/account/types'
import { functions } from './firebase'

export type AdminUser = {
  uid: string
  name: string
  email: string
  accountStatus: AccountStatus
  admin: boolean
  createdAt: string | null
}

export type AdminUserList = {
  users: AdminUser[]
  /** True when the instance has more accounts than one call returns. */
  truncated: boolean
}

export async function listUsersForAdmin(): Promise<AdminUserList> {
  const callable = httpsCallable<Record<string, never>, AdminUserList>(functions, 'adminListUsers')
  const result = await callable({})
  return result.data
}

export async function setAccountStatusForAdmin(
  uid: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  const callable = httpsCallable<{ uid: string; status: string }, { changed: boolean }>(
    functions,
    'adminSetAccountStatus',
  )
  await callable({ uid, status })
}
