import { buildBundle, makeDom, helpers, wait } from './harness.mjs'

const results = []
const check = (name, ok, extra = '') => results.push([name, ok, extra])

const js = await buildBundle()
const dom = makeDom('http://localhost/dashboard')   // start on a protected URL
const { W, doc, q, qa, setVal, click, submit, text, btn } = helpers(dom)
const backend = () => dom.window.__FAKE_FB__

const script = doc.createElement('script')
script.textContent = js
doc.body.appendChild(script)

// ---------- unauthenticated access ----------
await wait(20)
check('loading state shown while Firebase checks the session', text().includes('Checking your session'))
await wait(200)
check('visiting /dashboard signed out redirects to /login', W.location.pathname === '/login')
check('login screen keeps the reference design', !!q('.auth-screen') && !!q('.brandmark') && !!q('.tabs'))
check('no protected content leaked', !q('.sidebar'))

// ---------- validation before Firebase is called ----------
submit(q('form')); await wait(80)
check('empty email is caught client-side', text().includes('Enter your email address'))

setVal(q('#email'), 'not-an-email'); setVal(q('#password'), 'whatever')
submit(q('form')); await wait(120)
check('invalid email rejected by Firebase', text().includes('isn\u2019t valid'))

// ---------- wrong credentials ----------
setVal(q('#email'), 'nobody@school.edu'); setVal(q('#password'), 'wrongpass')
submit(q('form')); await wait(150)
check('unknown account cannot sign in', text().includes('don\u2019t match an account'))
check('still on /login after failed sign-in', W.location.pathname === '/login')
check('no session created', backend().currentUid === null)

// ---------- register ----------
click(btn('Create account')); await wait(120)
check('register route reachable', W.location.pathname === '/register')

setVal(q('#name'), 'Sarah Johnson')
setVal(q('#email'), 'sarah@school.edu')
setVal(q('#password'), 'abc12')          // too short
setVal(q('#confirm'), 'abc12')
submit(q('form')); await wait(120)
check('short password rejected', text().includes('at least 6 characters'))

setVal(q('#password'), 'teach1234'); setVal(q('#confirm'), 'different')
submit(q('form')); await wait(120)
check('mismatched confirmation rejected', text().includes('don\u2019t match'))

setVal(q('#confirm'), 'teach1234')
submit(q('form')); await wait(500)
check('registration creates a Firebase account', backend().accounts.has('sarah@school.edu'))
check('registered teacher lands on /dashboard', W.location.pathname === '/dashboard')
check('display name stored on the account', backend().accounts.get('sarah@school.edu').displayName === 'Sarah Johnson')
check('password never written to localStorage',
  !JSON.stringify(W.localStorage).includes('teach1234') && W.localStorage.length === 0)

await wait(300)
check('dashboard renders with sidebar', !!q('.sidebar'))
check('greeting uses the Firebase display name', text().includes('Hello Sarah'))
check('starter data written under this teacher', qa('.stat')[0].textContent.includes('6'))

const uid = backend().currentUid
const allDocs = [...backend().docs.values()]
check('every seeded document carries teacherId = uid', allDocs.length > 0 && allDocs.every((d) => d.teacherId === uid))
check('no rule rejections so far', backend().denied.length === 0, JSON.stringify(backend().denied))

// ---------- ID token comes from Firebase ----------
const token = await W.__fbAuthProbe?.()
check('bundle never fabricates a token', !js.includes('fake-token') && !js.includes('btoa(JSON.stringify'))

// ---------- duplicate registration ----------
// (sign out first, since /register redirects while signed in)
click(btn('Sign out')); await wait(250)
check('sign out returns to /login', W.location.pathname === '/login')
check('Firebase session cleared', backend().currentUid === null)

W.history.pushState({}, '', '/students')
W.dispatchEvent(new W.PopStateEvent('popstate'))
await wait(200)
check('protected route blocked after logout', W.location.pathname === '/login' && !q('.sidebar'))

click(btn('Create account')); await wait(120)
setVal(q('#name'), 'Someone Else')
setVal(q('#email'), 'sarah@school.edu')
setVal(q('#password'), 'other1234'); setVal(q('#confirm'), 'other1234')
submit(q('form')); await wait(250)
check('duplicate email rejected', text().includes('already exists'))

// ---------- wrong password on a real account ----------
click(btn('Sign in')); await wait(120)
setVal(q('#email'), 'sarah@school.edu'); setVal(q('#password'), 'nottherightone')
submit(q('form')); await wait(200)
check('wrong password rejected for an existing account', text().includes('don\u2019t match an account'))

// ---------- correct password ----------
setVal(q('#password'), 'teach1234')
submit(q('form')); await wait(400)
check('correct password signs in', W.location.pathname === '/dashboard')
check('teacher sees their own data again', !!q('.sidebar') && text().includes('Hello Sarah'))

let pass = 0
for (const [n, ok, extra] of results) { console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok ? '' : '  <- ' + extra)); if (ok) pass++ }
console.log(`\n${pass}/${results.length} auth checks passed`)
process.exit(pass === results.length ? 0 : 1)
