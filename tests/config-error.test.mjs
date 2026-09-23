/**
 * Reproduces the exact reported bug and proves the fix, using the REAL
 * firebase/app, firebase/auth and firebase/firestore packages — not the
 * test doubles in tests/fakes. Those fakes never throw on bad config
 * (that's not what they're for), so they can't catch this class of bug;
 * this file exists specifically so nothing here is mocked away.
 *
 * Before the fix: importing firebaseConfig.js with missing env vars threw
 * synchronously from getAuth(), which — because the throw happens at
 * module-evaluation time — would abort every file that imports it
 * (AuthContext, DataContext, seed.js) and therefore abort main.jsx before
 * ReactDOM ever renders. That is the blank page.
 */
import * as esbuild from 'esbuild'
import path from 'path'
import { execFileSync } from 'child_process'
import fs from 'fs'

const root = process.cwd()
const results = []
const check = (name, ok, extra = '') => results.push([name, ok, extra])

/**
 * Each case runs in its own Node process, the way each real page load in a
 * browser gets a clean slate. Without this, Firebase's internal "[DEFAULT]
 * app already exists" registry persists across calls in the same process and
 * makes the second and third case fail for a reason that has nothing to do
 * with the app.
 */
async function loadConfigModule(envOverrides) {
  const define = {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(envOverrides.apiKey ?? ''),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(envOverrides.authDomain ?? ''),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(envOverrides.projectId ?? ''),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(envOverrides.storageBucket ?? ''),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(envOverrides.messagingSenderId ?? ''),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(envOverrides.appId ?? ''),
  }
  const built = await esbuild.build({
    entryPoints: [path.join(root, 'src/firebase/firebaseConfig.js')],
    bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2020', define,
    // Leave the firebase/* imports alone and let Node's own resolver handle
    // them. Bundling firebase/firestore for a plain Node target drags in its
    // gRPC transport (Node-only, used for server SDKs), which esbuild can't
    // fully inline — that's a limitation of this test script, not of the
    // real app. Vite's browser build never takes that code path: it resolves
    // Firebase's browser bundle instead, which is what production actually
    // ships.
    external: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  })
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tmp = path.join(root, `tests/.tmp-config-${tag}.mjs`)
  const runner = path.join(root, `tests/.tmp-runner-${tag}.mjs`)
  fs.writeFileSync(tmp, built.outputFiles[0].text)
  // Re-export as plain data (functions can't cross a process boundary) so
  // the child process can print something the parent can JSON.parse back.
  fs.writeFileSync(runner, `
    import * as mod from ${JSON.stringify('file://' + tmp)}
    process.stdout.write(JSON.stringify({
      firebaseConfigError: mod.firebaseConfigError,
      hasAuth: mod.auth !== null && typeof mod.auth === 'object',
      hasDb: mod.db !== null && typeof mod.db === 'object',
      idToken: await mod.getIdToken(),
    }))
  `)
  try {
    const out = execFileSync(process.execPath, [runner], { encoding: 'utf8' })
    return JSON.parse(out)
  } finally {
    fs.unlinkSync(tmp)
    fs.unlinkSync(runner)
  }
}

// ---------- case 1: every var missing, exactly what the user reported ----------
{
  let threw = null
  let mod = null
  try {
    mod = await loadConfigModule({})
  } catch (e) {
    threw = e
  }
  check('module import does NOT throw with all vars missing (this was the blank-page bug)', threw === null, threw?.message)
  check('firebaseConfigError is set and mentions "Missing"', !!mod?.firebaseConfigError && mod.firebaseConfigError.includes('Missing'))
  check('auth export is null, not a broken object', mod?.hasAuth === false)
  check('db export is null, not a broken object', mod?.hasDb === false)
  check('getIdToken() resolves to null instead of throwing', mod?.idToken === null)
}

// ---------- case 2: some vars present, some missing (partial Vercel setup) ----------
{
  const mod = await loadConfigModule({ authDomain: 'x.firebaseapp.com', projectId: 'x' })
  check('partial config still does not throw on import', true) // reaching here means no throw
  check('partial config still reports which keys are missing', mod.firebaseConfigError?.includes('apiKey'))
}

// ---------- case 3: a well-formed config (what it should look like after the fix) ----------
{
  const mod = await loadConfigModule({
    apiKey: 'AIzaSyD-FAKE1234567890abcdefghijklmno',
    authDomain: 'classpilot-98693.firebaseapp.com',
    projectId: 'classpilot-98693',
    storageBucket: 'classpilot-98693.firebasestorage.app',
    messagingSenderId: '279223257521',
    appId: '1:279223257521:web:6db67c08cbc5e87ce71590',
  })
  check('well-formed config produces no configError', mod.firebaseConfigError === null)
  check('well-formed config produces a real auth object', mod.hasAuth === true)
  check('well-formed config produces a real db object', mod.hasDb === true)
}

let pass = 0
for (const [n, ok, extra] of results) { console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok ? '' : '  <- ' + extra)); if (ok) pass++ }
console.log(`\n${pass}/${results.length} config-error checks passed`)
process.exit(pass === results.length ? 0 : 1)
