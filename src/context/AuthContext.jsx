import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

/** Firebase error codes turned into something a teacher can act on. */
export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'That email address isn\u2019t valid.'
    case 'auth/missing-password':
      return 'Enter your password.'
    case 'auth/weak-password':
      return 'Password needs at least 6 characters.'
    case 'auth/email-already-in-use':
      return 'An account already exists with that email. Sign in instead.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'That email and password don\u2019t match an account.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Can\u2019t reach Firebase. Check your connection and try again.'
    case 'auth/requires-recent-login':
      return 'For security, sign in again before making this change.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is turned off in the Firebase console.'
    default:
      return error?.message?.replace('Firebase: ', '') || 'Something went wrong. Try again.'
  }
}

/**
 * Wraps Firebase Authentication.
 *
 * Firebase owns the session: it persists it, refreshes ID tokens, and tells
 * us about changes through onAuthStateChanged. Nothing here writes
 * credentials or tokens to storage.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fires once on load with the restored session (or null), then again on
    // every sign-in and sign-out. `loading` stays true until that first call,
    // so protected pages never flash before we know who the user is.
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser)
        setLoading(false)
      },
      (error) => {
        console.error('Auth state listener failed:', error)
        setUser(null)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    if (!name?.trim()) return { error: 'Enter your full name.' }
    try {
      const { user: created } = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(created, { displayName: name.trim() })
      // updateProfile doesn't re-emit onAuthStateChanged, so push the new
      // displayName into state ourselves.
      setUser({ ...created, displayName: name.trim() })
      return { ok: true, user: created }
    } catch (error) {
      return { error: authErrorMessage(error), code: error.code }
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email.trim(), password)
      return { ok: true, user: signedIn }
    } catch (error) {
      return { error: authErrorMessage(error), code: error.code }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [])

  /** Re-authenticate before a sensitive change (email, password, deletion). */
  const reauthenticate = useCallback(async (currentPassword) => {
    const current = auth.currentUser
    if (!current?.email) return { error: 'No signed-in account.' }
    try {
      const credential = EmailAuthProvider.credential(current.email, currentPassword)
      await reauthenticateWithCredential(current, credential)
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error), code: error.code }
    }
  }, [])

  const updateDisplayName = useCallback(async (name) => {
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() })
      setUser((u) => ({ ...auth.currentUser, displayName: name.trim() }) )
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [])

  const changeEmail = useCallback(async (nextEmail, currentPassword) => {
    const re = await reauthenticate(currentPassword)
    if (re.error) return re
    try {
      await updateEmail(auth.currentUser, nextEmail.trim())
      setUser({ ...auth.currentUser })
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [reauthenticate])

  const changePassword = useCallback(async ({ current, next, confirm }) => {
    if (next.length < 6) return { error: 'The new password needs at least 6 characters.' }
    if (next !== confirm) return { error: 'The two new passwords don\u2019t match.' }
    const re = await reauthenticate(current)
    if (re.error) {
      return { error: re.code === 'auth/invalid-credential' || re.code === 'auth/wrong-password'
        ? 'The current password is wrong.'
        : re.error }
    }
    try {
      await updatePassword(auth.currentUser, next)
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [reauthenticate])

  /** Deletes the Firebase account itself. Caller removes Firestore data first. */
  const deleteAccount = useCallback(async (currentPassword) => {
    const re = await reauthenticate(currentPassword)
    if (re.error) {
      return { error: re.code === 'auth/invalid-credential' || re.code === 'auth/wrong-password'
        ? 'That password is wrong.'
        : re.error }
    }
    try {
      await deleteUser(auth.currentUser)
      return { ok: true }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [reauthenticate])

  const value = useMemo(() => ({
    user,
    uid: user?.uid || null,
    loading,
    isAuthed: Boolean(user),
    register, login, logout,
    reauthenticate, updateDisplayName, changeEmail, changePassword, deleteAccount,
  }), [user, loading, register, login, logout, reauthenticate, updateDisplayName,
       changeEmail, changePassword, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
