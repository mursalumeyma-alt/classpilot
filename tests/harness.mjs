// Bundles the real application source, substituting the Firebase SDK with the
// test doubles in tests/fakes, and runs it in jsdom.
import * as esbuild from 'esbuild'
import { JSDOM } from 'jsdom'
import path from 'path'

const root = process.cwd()
const aliases = {
  'firebase/app': path.join(root, 'tests/fakes/firebase-app.js'),
  'firebase/auth': path.join(root, 'tests/fakes/firebase-auth.js'),
  'firebase/firestore': path.join(root, 'tests/fakes/firebase-firestore.js'),
}

const aliasPlugin = {
  name: 'firebase-alias',
  setup(build) {
    build.onResolve({ filter: /^firebase\// }, (args) => {
      const target = aliases[args.path]
      if (!target) throw new Error(`No fake for ${args.path}`)
      return { path: target }
    })
  },
}

// Styles are irrelevant to behaviour tests; stub them out.
const cssStubPlugin = {
  name: 'css-stub',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-stub' }))
    build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({ contents: '', loader: 'js' }))
  },
}

export async function buildBundle() {
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'src/main.jsx')],
    bundle: true, write: false, format: 'iife', loader: { '.js': 'jsx' },
    jsx: 'automatic', target: 'es2020',
    define: {
      'process.env.NODE_ENV': '"development"',
      'import.meta.env.VITE_FIREBASE_API_KEY': '"test-api-key"',
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': '"test.firebaseapp.com"',
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': '"test-project"',
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': '"test.appspot.com"',
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': '"1234"',
      'import.meta.env.VITE_FIREBASE_APP_ID': '"1:1234:web:abcd"',
    },
    plugins: [aliasPlugin, cssStubPlugin],
    external: [],
  })
  return result.outputFiles[0].text
}

export function makeDom(url = 'http://localhost/login') {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
    { url, runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.scrollTo = () => {}
  dom.window.matchMedia = dom.window.matchMedia || ((q) => ({
    matches: false, media: q, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
  }))
  return dom
}

export const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export function helpers(dom) {
  const W = dom.window, doc = W.document
  const q = (s) => doc.querySelector(s)
  const qa = (s) => [...doc.querySelectorAll(s)]
  const setVal = (el, v) => {
    const proto = el.type === 'checkbox' ? W.HTMLInputElement.prototype
      : el.tagName === 'TEXTAREA' ? W.HTMLTextAreaElement.prototype : W.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new W.Event('input', { bubbles: true }))
  }
  const click = (el) => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true, cancelable: true, view: W }))
  const submit = (form) => form.dispatchEvent(new W.Event('submit', { bubbles: true, cancelable: true }))
  // Read the rendered app only. doc.body.textContent would also include
  // the injected <script> source, which produces false matches.
  const text = () => doc.getElementById('root')?.textContent || ''
  const btn = (label, scope = null) =>
    [...(scope || doc.getElementById('root') || doc).querySelectorAll('button, a')]
      .find((b) => b.textContent.trim().toLowerCase().includes(label.toLowerCase()))
  return { W, doc, q, qa, setVal, click, submit, text, btn }
}
