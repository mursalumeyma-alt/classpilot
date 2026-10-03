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

/**
 * Human-readable explanation of why Firebase isn't working, or null if it's
 * fine. The rest of the app checks this instead of letting Firebase throw.
 */
export let firebaseConfigError = null

if (missing.length) {
  firebaseConfigError =
    `Firebase config is incomplete. Missing: ${missing.join(', ')}. ` +
    'Copy .env.example to .env and fill in the values from your Firebase console ' +
    '(Project settings → General → Your apps → SDK setup and configuration). ' +
    'On Vercel, add the same variables under Project Settings → Environment Variables, ' +
    'then redeploy — Vite bakes them in at build time, so a new deploy is required after adding them.'
  console.error(firebaseConfigError)
}

// initializeApp/getAuth/getFirestore run at module load time, before any
// React component exists. If one of them throws here — which getAuth() does
// synchronously for a bad or missing apiKey — the throw propagates up
// through every file that imports this module (AuthContext, DataContext,
// seed.js), which stops main.jsx before it ever calls ReactDOM.render().
// That is what produces a blank page with nothing but a console error, even
// though `vite build` itself succeeds. Catching it here means the rest of
// the app loads normally and can show a real message instead.
export let app = null
export let auth = null
export let db = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (error) {
  firebaseConfigError = firebaseConfigError || `Firebase failed to start: ${error.message}`
  console.error('Firebase initialization failed:', error)
}

/**
 * Current Firebase ID token, for calls to your own backend.
 * Firebase refreshes it automatically, so always read it fresh here rather
 * than caching a copy. Send it as: Authorization: Bearer <token>
 */
export async function getIdToken() {
  const user = auth?.currentUser
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