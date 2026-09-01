import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'

type AdminState = { loading: boolean; isAdmin: boolean }

/**
 * Whether this account is an operator.
 *
 * Read from the user's own document, which they are allowed to read and which the
 * rules forbid them to write. It decides what the nav shows and nothing else: the
 * gate that matters is in `requireAdmin` inside the callables.
 */
export function useIsAdmin(userId: string | undefined): AdminState {
  const [state, setState] = useState<AdminState>({ loading: true, isAdmin: false })

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, isAdmin: false })
      return
    }

    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => setState({ loading: false, isAdmin: snapshot.data()?.admin === true }),
      () => setState({ loading: false, isAdmin: false }),
    )
  }, [userId])

  return state
}
