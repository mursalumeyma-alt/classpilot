import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase configuration.
 *
 * Values come from .env (see .env.example). Vite only exposes variables
 * prefixed with VITE_ to the client. These keys are not secrets — they
 * identify the project publicly — but they stay out of source control so
 * each environment (dev / staging / prod) can point at its own project.
 * The actual protection of teacher data comes from Firestore security
 * rules, not from hiding these values.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missing.length) {
  console.error(
    `Firebase config is incomplete. Missing: ${missing.join(', ')}.\n` +
    'Copy .env.example to .env and fill in the values from your Firebase console ' +
    '(Project settings → General → Your apps → SDK setup and configuration).'
  )
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

/**
 * Current Firebase ID token, for calls to your own backend.
 * Firebase refreshes it automatically, so always read it fresh here rather
 * than caching a copy. Send it as: Authorization: Bearer <token>
 */
export async function getIdToken() {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

/** fetch() wrapper that attaches the current ID token. */
export async function authedFetch(url, options = {}) {
  const token = await getIdToken()
  if (!token) throw new Error('Not signed in.')
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  })
}

export default app
