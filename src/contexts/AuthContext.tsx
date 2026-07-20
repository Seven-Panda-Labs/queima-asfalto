import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import {
  EMULATOR_DEV_EMAIL,
  EMULATOR_DEV_PASSWORD,
  isFirebaseEmulatorsFull,
} from '../config/emulators'
import { ensureUserProfile } from '../services/users'
import { clearUserLocalStorage } from '../utils/userStorage'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmulatorDev: () => Promise<void>
  signOut: () => Promise<void>
  emulatorSignInAvailable: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        void ensureUserProfile(firebaseUser).catch((error) => {
          console.error('Failed to ensure user profile:', error)
        })
      }
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }, [])

  const signInWithEmulatorDev = useCallback(async () => {
    try {
      await signInWithEmailAndPassword(auth, EMULATOR_DEV_EMAIL, EMULATOR_DEV_PASSWORD)
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        await createUserWithEmailAndPassword(auth, EMULATOR_DEV_EMAIL, EMULATOR_DEV_PASSWORD)
        return
      }
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const uid = auth.currentUser?.uid
    await firebaseSignOut(auth)
    if (uid) {
      clearUserLocalStorage(uid)
    }
  }, [])

  const emulatorSignInAvailable = isFirebaseEmulatorsFull()

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmulatorDev,
      signOut,
      emulatorSignInAvailable,
    }),
    [user, loading, signInWithGoogle, signInWithEmulatorDev, signOut, emulatorSignInAvailable],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
