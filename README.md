# ClassPilot

Simple class management for individual teachers — tutors, after-school leads, classroom
teachers. Not a school-wide admin system.

Authentication is **real Firebase Authentication** (email/password) and data lives in
**Cloud Firestore**, scoped per teacher.

---

## 1. Set up Firebase (once per project)

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Authentication → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (start in production mode; the rules
   below replace the defaults).
4. **Project settings → General → Your apps → Web app** — copy the config values.
5. `cp .env.example .env` and paste the values in.
6. Deploy the security rules:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules
```

Step 6 is not optional. Until `firestore.rules` is deployed, the database is open and the
per-teacher separation is only enforced in the browser.

## 2. Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm test
```

There is no demo login. Create an account on `/register`; it becomes a real Firebase user.
New accounts can opt into starter classes and students — those are written to Firestore
under that teacher's own uid, exactly like data they create themselves.

---

## Authentication

`src/firebase/firebaseConfig.js` initialises the app and exports `auth`, `db`,
`getIdToken()` and `authedFetch()`.

`src/context/AuthContext.jsx` wraps the SDK and exposes `user`, `loading`, `register`,
`login`, `logout`, `changePassword`, `changeEmail`, `deleteAccount` and `reauthenticate`.
Firebase owns the session — it persists it, refreshes ID tokens and reports changes
through `onAuthStateChanged`. Nothing writes credentials or tokens to storage.

`loading` starts `true` and only flips after the first `onAuthStateChanged` callback, so a
refresh on `/dashboard` shows the loading screen rather than flashing `/login`.

Firebase error codes are translated in `authErrorMessage()`, so a teacher sees "That email
and password don't match an account" instead of `auth/invalid-credential`.

### Routes

| Route | Access |
| --- | --- |
| `/login`, `/register` | public; redirect to `/dashboard` when already signed in |
| `/dashboard`, `/students`, `/classes`, `/messages`, `/profile` | wrapped in `ProtectedRoute` |

`src/components/ProtectedRoute.jsx` has three states: loading → loading screen; no user →
`<Navigate to="/login">` carrying the attempted location so sign-in returns there;
signed in → render.

### ID tokens

Never fabricated, never cached by hand. When a backend call needs one:

```js
import { getIdToken, authedFetch } from './firebase/firebaseConfig'

const token = await getIdToken()             // auth.currentUser.getIdToken()
await authedFetch('/api/reports')            // sends Authorization: Bearer <token>
```

Firebase rotates the token roughly hourly; always read it fresh at call time.

## Teacher-specific data

Every document carries `teacherId: user.uid`, and every query filters on the signed-in
teacher's uid:

```js
query(collection(db, 'students'), where('teacherId', '==', uid))
```

Collections: `students`, `classes`, `reminders`, `activity`, `threads`.

`src/context/DataContext.jsx` opens one `onSnapshot` listener per collection, so two
browser tabs stay in sync. Listeners are torn down and state is cleared on sign-out.

**The frontend filter is a convenience, not the security boundary.** `firestore.rules`
enforces ownership on the server:

- read / delete require `resource.data.teacherId == request.auth.uid`
- create requires `request.resource.data.teacherId == request.auth.uid`
- update requires **both**, so `teacherId` can never be reassigned to another teacher
- everything unmatched is denied

### Students ↔ classes stays many-to-many

The join is stored once, as `student.classIds: string[]` on the student document. Classes
keep no student list, so the two sides can't drift apart. Helpers on `DataContext`:

| Helper | Direction |
| --- | --- |
| `rosterOf(classId)` | class → students |
| `classesOf(student)` / `classNamesOf(student)` | student → classes |
| `setStudentClasses(studentId, classIds)` | edit from the student form |
| `setClassRoster(classId, studentIds)` | edit from the class form, batched |

Deleting a class removes the class document and strips its id from every student in one
`writeBatch`, so a failure can't half-apply.

Queries use a single `where` with client-side sorting, so no composite indexes are needed.

## Tests

```bash
npm test
```

`tests/fakes/` contains stand-ins for `firebase/app`, `firebase/auth` and
`firebase/firestore` with the real SDK's function names and error codes. The harness
bundles the actual `src/` with esbuild, swaps those three imports, and drives the result in
jsdom. **Application code is never modified for tests** — there is no mock mode in `src/`.

- `tests/auth.test.mjs` (29) — loading state, redirect when signed out, validation, wrong
  password, unknown account, duplicate registration, display name, sign out, no password or
  token in localStorage.
- `tests/teacher-data.test.mjs` (31) — two teachers in one database: A's data invisible to
  B, every write stamped with the right uid, plus the MVP regressions (search, CRUD,
  many-to-many from both sides, class deletion cleanup, refresh signed in and signed out).
- `tests/rules.test.mjs` (9) — negative control: unscoped queries, cross-teacher reads and
  writes, `teacherId` reassignment and signed-out access all rejected.

The doubles mirror `firestore.rules`; they do not execute it. Before release, run the real
rules against the emulator:

```bash
firebase emulators:start --only firestore
# then exercise them with @firebase/rules-unit-testing
```

## Still to do

- Multi-factor auth (Firebase MFA needs the Blaze plan) — the Profile toggle says so.
- Password reset via `sendPasswordResetEmail`.
- Profile photos need Firebase Storage.
- Attendance and grading. The dashboard's "Class average" and "Performance summary" are
  still placeholders.
