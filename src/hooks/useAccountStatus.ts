import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  canAccessAppData,
  resolveEffectiveAccountStatus,
  type AccountStatus,
} from '../../shared/account/types'
import { isAccountApprovalEnabled } from '../config/accountApproval'
import { db } from '../services/firebase'

type AccountStatusState = {
  loading: boolean
  status: AccountStatus
  canAccessApp: boolean
}

const approvedState: AccountStatusState = {
  loading: false,
  status: 'approved',
  canAccessApp: true,
}

export function useAccountStatus(userId: string | undefined): AccountStatusState {
  const approvalEnabled = isAccountApprovalEnabled()
  const [state, setState] = useState<AccountStatusState>(() =>
    approvalEnabled
      ? { loading: true, status: 'approved', canAccessApp: false }
      : approvedState,
  )

  useEffect(() => {
    if (!approvalEnabled || !userId) {
      setState(approvedState)
      return
    }

    setState({ loading: true, status: 'approved', canAccessApp: false })

    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        const status = resolveEffectiveAccountStatus(snapshot.data())
        setState({
          loading: false,
          status,
          canAccessApp: canAccessAppData(status),
        })
      },
      () => {
        setState({ loading: true, status: 'approved', canAccessApp: false })
      },
    )
  }, [approvalEnabled, userId])

  return state
}
