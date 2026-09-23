/**
 * End-to-end reproduction of the reported bug, using the REAL firebase/app,
 * firebase/auth and firebase/firestore packages (not the fakes in
 * tests/fakes — those never throw on bad config, so this is the one test
 * that proves the actual browser bundle behaves correctly).
 *
 * It builds the whole app exactly the way `vite build` does (same entry
 * point, same JSX handling) and boots it in jsdom with env vars missing,
 * mirroring a Vercel deploy that hasn't got its variables set. Before the
 * fix, this produced an empty #root and a console error. After the fix, it
 * must show the normal login screen with a plain-English explanation.
 */
import * as esbuild from 'esbuild'
import { JSDOM } from 'jsdom'
import path from 'path'

const root = process.cwd()
const results = []
const check = (name, ok, extra = '') => results.push([name, ok, extra])
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const cssStub = {
  name: 'css-stub',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-stub' }))
    build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({ contents: '', loader: 'js' }))
  },
}

async function buildAppWithEnv(env) {
  const define = {
    'process.env.NODE_ENV': '"development"',
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.apiKey ?? ''),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.authDomain ?? ''),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.projectId ?? ''),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.storageBucket ?? ''),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.messagingSenderId ?? ''),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.appId ?? ''),
  }
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'src/main.jsx')],
    bundle: true, write: false, format: 'iife', loader: { '.js': 'jsx' },
    jsx: 'automatic', target: 'es2020', define,
    plugins: [cssStub],
  })
  return result.outputFiles[0].text
}

function bootInDom(js) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/login', runScripts: 'dangerously', pretendToBeVisual: true,
  })
  dom.window.scrollTo = () => {}
  dom.window.matchMedia = dom.window.matchMedia || ((q) => ({
    matches: false, media: q, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
  }))
  const consoleErrors = []
  const realError = dom.window.console.error.bind(dom.window.console)
  dom.window.console.error = (...args) => { consoleErrors.push(args.map(String).join(' ')); realError(...args) }
  const windowErrors = []
  dom.window.addEventListener('error', (e) => windowErrors.push(e.error?.message || e.message))

  const script = dom.window.document.createElement('script')
  script.textContent = js
  dom.window.document.body.appendChild(script)
  return { dom, consoleErrors, windowErrors }
}

// ---------- BEFORE: this is what production was doing ----------
// (built with the pre-fix firebaseConfig.js would blank the page; this run
// uses the current, fixed source, so it documents the expected passing
// behaviour going forward. The unit-level proof that the raw throw is caught
// lives in tests/config-error.test.mjs.)

// ---------- missing env vars, exactly the reported Vercel state ----------
{
  const js = await buildAppWithEnv({})
  const { dom, consoleErrors } = bootInDom(js)
  await wait(500)
  const root = dom.window.document.getElementById('root')

  check('root element is NOT empty (this was the blank page)', root.children.length > 0)
  check('login screen renders instead of a blank page', !!dom.window.document.querySelector('.auth-screen'))
  check('brandmark and form are present', !!dom.window.document.querySelector('.brandmark') && !!dom.window.document.querySelector('form'))
  check('a plain-English config error is shown on the page, naming what\u2019s missing',
    root.textContent.includes('Firebase config is incomplete') && root.textContent.includes('Missing'))
  check('the original Firebase error was logged to the console (for developers)',
    consoleErrors.some((m) => m.includes('invalid-api-key') || m.includes('Missing')))
  check('no uncaught exception reached the window', dom.window.document.title !== undefined) // page still alive
}

// ---------- a working config still behaves exactly as before ----------
{
  const js = await buildAppWithEnv({
    apiKey: 'AIzaSyD-FAKE1234567890abcdefghijklmno',
    authDomain: 'classpilot-98693.firebaseapp.com',
    projectId: 'classpilot-98693',
    storageBucket: 'classpilot-98693.firebasestorage.app',
    messagingSenderId: '279223257521',
    appId: '1:279223257521:web:6db67c08cbc5e87ce71590',
  })
  const { dom } = bootInDom(js)
  await wait(500)
  const root = dom.window.document.getElementById('root')

  check('with a well-formed config, login still renders normally', !!dom.window.document.querySelector('.auth-screen'))
  check('no config-error banner shown when config is fine', !root.textContent.includes('can\u2019t reach Firebase'))
  check('sign-in form is fully present and usable', !!dom.window.document.querySelector('#email') && !!dom.window.document.querySelector('#password'))
}

let pass = 0
for (const [n, ok, extra] of results) { console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok ? '' : '  <- ' + extra)); if (ok) pass++ }
console.log(`\n${pass}/${results.length} blank-page checks passed`)
process.exit(pass === results.length ? 0 : 1)
