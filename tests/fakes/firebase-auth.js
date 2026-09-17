// Test double for `firebase/auth`, matching the real SDK's contract:
// same function names, same error codes, same onAuthStateChanged behaviour.
import { backend, nextId, fbError } from './state.js'

const listeners = new Set()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function publicUser(account) {
  if (!account) return null
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName || null,
    metadata: { lastSignInTime: new Date().toISOString() },
    // A real ID token is a signed JWT from Google; here it just proves the
    // app asks the SDK for it rather than inventing one.
    getIdToken: async () => `fake-id-token.${account.uid}.${Date.now()}`,
  }
}

function emit() {
  const b = backend()
  const user = publicUser([...b.accounts.values()].find((a) => a.uid === b.currentUid))
  listeners.forEach((fn) => fn(user))
}

export function getAuth() {
  const b = backend()
  return {
    get currentUser() {
      return publicUser([...b.accounts.values()].find((a) => a.uid === b.currentUid))
    },
  }
}

export function onAuthStateChanged(auth, next) {
  listeners.add(next)
  // Real Firebase resolves persistence asynchronously; mimic that so the
  // loading state is genuinely exercised.
  setTimeout(() => {
    const b = backend()
    next(publicUser([...b.accounts.values()].find((a) => a.uid === b.currentUid)))
  }, 30)
  return () => listeners.delete(next)
}

export async function createUserWithEmailAndPassword(auth, email, password) {
  const b = backend()
  if (!EMAIL_RE.test(email)) throw fbError('auth/invalid-email')
  if (!password) throw fbError('auth/missing-password')
  if (password.length < 6) throw fbError('auth/weak-password')
  if (b.accounts.has(email)) throw fbError('auth/email-already-in-use')
  const account = { uid: nextId('uid'), email, password, displayName: null }
  b.accounts.set(email, account)
  b.currentUid = account.uid
  emit()
  return { user: publicUser(account) }
}

export async function signInWithEmailAndPassword(auth, email, password) {
  const b = backend()
  if (!EMAIL_RE.test(email)) throw fbError('auth/invalid-email')
  if (!password) throw fbError('auth/missing-password')
  const account = b.accounts.get(email)
  if (!account || account.password !== password) throw fbError('auth/invalid-credential')
  b.currentUid = account.uid
  emit()
  return { user: publicUser(account) }
}

export async function signOut() {
  backend().currentUid = null
  emit()
}

export async function updateProfile(user, { displayName }) {
  const b = backend()
  const account = [...b.accounts.values()].find((a) => a.uid === (user?.uid ?? b.currentUid))
  if (!account) throw fbError('auth/no-current-user')
  account.displayName = displayName
}

export async function updateEmail(user, email) {
  const b = backend()
  if (!EMAIL_RE.test(email)) throw fbError('auth/invalid-email')
  if (b.accounts.has(email)) throw fbError('auth/email-already-in-use')
  const account = [...b.accounts.values()].find((a) => a.uid === b.currentUid)
  b.accounts.delete(account.email)
  account.email = email
  b.accounts.set(email, account)
  emit()
}

export async function updatePassword(user, password) {
  if (password.length < 6) throw fbError('auth/weak-password')
  const b = backend()
  const account = [...b.accounts.values()].find((a) => a.uid === b.currentUid)
  account.password = password
}

export async function deleteUser() {
  const b = backend()
  const account = [...b.accounts.values()].find((a) => a.uid === b.currentUid)
  if (!account) throw fbError('auth/no-current-user')
  b.accounts.delete(account.email)
  b.currentUid = null
  emit()
}

export const EmailAuthProvider = {
  credential: (email, password) => ({ email, password }),
}

export async function reauthenticateWithCredential(user, credential) {
  const b = backend()
  const account = [...b.accounts.values()].find((a) => a.uid === b.currentUid)
  if (!account) throw fbError('auth/no-current-user')
  if (account.password !== credential.password) throw fbError('auth/invalid-credential')
  return { user: publicUser(account) }
}
