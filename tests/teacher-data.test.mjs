import { buildBundle, makeDom, helpers, wait } from './harness.mjs'

const results = []
const check = (name, ok, extra = '') => results.push([name, ok, extra])

const js = await buildBundle()
const dom = makeDom('http://localhost/register')
const { W, doc, q, qa, setVal, click, submit, text, btn } = helpers(dom)
const backend = () => W.__FAKE_FB__

const run = () => {
  const s = doc.createElement('script'); s.textContent = js; doc.body.appendChild(s)
}
/** Simulate a full page reload in the same "browser". */
const reload = async (pathname) => {
  W.history.pushState({}, '', pathname)
  const old = doc.getElementById('root')
  old.remove()
  const fresh = doc.createElement('div'); fresh.id = 'root'; doc.body.appendChild(fresh)
  run()
  await wait(400)
}

run(); await wait(250)

const register = async (name, email, password, starter = true) => {
  setVal(q('#name'), name); setVal(q('#email'), email)
  setVal(q('#password'), password); setVal(q('#confirm'), password)
  const box = q('.check input')
  if (box && box.checked !== starter) click(box)
  submit(q('form')); await wait(500)
}
const gotoPage = async (page) => {
  click(qa('.nav-item').find((a) => a.dataset.page === page)); await wait(250)
}
const openModalButton = (label) => btn(label, doc.querySelector('.modal') || doc)

// ---------- teacher A ----------
await register('Amina Otieno', 'amina@school.ke', 'amina1234', true)
const uidA = backend().currentUid
check('teacher A registered and on dashboard', W.location.pathname === '/dashboard')

await gotoPage('students')
check('teacher A sees 6 starter students', qa('.ecard').length === 6)

// create a student, assigned to two classes (many-to-many, now in Firestore)
click(q('.page-head .btn')); await wait(200)
setVal(q('#sname'), 'Wanjiru Kamau'); setVal(q('#sage'), '9')
setVal(q('#semail'), 'wanjiru@student.edu')
const boxes = qa('.check input')
click(boxes[0]); click(boxes[1])
submit(q('.modal form')); await wait(400)

check('student created', qa('.ecard').length === 7)
const created = [...backend().docs.entries()].find(([k, d]) => d.name === 'Wanjiru Kamau')
check('new student stamped with teacherId', created?.[1].teacherId === uidA)
check('new student joined two classes', created?.[1].classIds.length === 2)
const wanjiruCard = qa('.ecard').find((c) => c.textContent.includes('Wanjiru Kamau'))
check('card shows both class names', (wanjiruCard.textContent.match(/Grade/g) || []).length >= 2)

// search still works against Firestore-backed state
setVal(q('.searchbox input'), 'Wanjiru'); await wait(200)
check('search filters the roster', qa('.ecard').length === 1)
setVal(q('.searchbox input'), ''); await wait(200)

// edit from the class side
await gotoPage('classes')
check('teacher A sees 3 starter classes', qa('.ecard').length === 3)
// Wanjiru was created in Reading + Science, so Mathematics is the one she is
// missing — add her from the class side and confirm the student record changes.
const mathCard = qa('.ecard').find((c) => c.textContent.includes('3rd Grade Mathematics'))
click(mathCard.querySelector('.act')); await wait(250)
const wBox = qa('.check').find((l) => l.textContent.includes('Wanjiru')).querySelector('input')
check('class-side checkbox reflects current membership', wBox.checked === false)
click(wBox)
submit(q('.modal form')); await wait(400)
const afterAdd = [...backend().docs.values()].find((d) => d.name === 'Wanjiru Kamau')
check('class-side edit adds to student.classIds', afterAdd.classIds.length === 3)

// Now take her back out from the same side.
const mathCard2 = qa('.ecard').find((c) => c.textContent.includes('3rd Grade Mathematics'))
check('class card count reflects the new member', mathCard2.textContent.includes('4 students'))
click(mathCard2.querySelector('.act')); await wait(250)
const wBox2 = qa('.check').find((l) => l.textContent.includes('Wanjiru')).querySelector('input')
check('checkbox now shows her as a member', wBox2.checked === true)
click(wBox2)
submit(q('.modal form')); await wait(400)
const afterRemove = [...backend().docs.values()].find((d) => d.name === 'Wanjiru Kamau')
check('class-side edit removes from student.classIds', afterRemove.classIds.length === 2)

// delete a class -> detaches students, keeps them
const sci = [...backend().docs.entries()].find(([, d]) => d.name === '4th Grade Science')
const sciId = sci[0].split('/')[1]
const sciCard = qa('.ecard').find((c) => c.textContent.includes('4th Grade Science'))
click(sciCard.querySelectorAll('.act')[1]); await wait(200)
click(openModalButton('Delete class')); await wait(400)
check('class deleted', qa('.ecard').length === 2)
const studentsNow = [...backend().docs.values()].filter((d) => d.classIds)
check('students survive class deletion', studentsNow.length === 7)
check('orphan classIds cleaned up', studentsNow.every((s) => !s.classIds.includes(sciId)))

// profile still works
await gotoPage('profile')
check('profile shows the Firebase account', text().includes('amina@school.ke'))
check('profile counts teacher A data', text().includes('Students') && q('.pcard').textContent.includes('7'))

const docsA = [...backend().docs.values()].filter((d) => d.teacherId === uidA).length
check('teacher A owns every document created so far',
  [...backend().docs.values()].every((d) => d.teacherId === uidA))

// ---------- refresh while signed in ----------
await reload('/students')
check('refresh while signed in stays on /students', W.location.pathname === '/students' && !!q('.sidebar'))
check('data reloads from Firestore after refresh', qa('.ecard').length === 7)

// ---------- teacher B ----------
click(btn('Sign out')); await wait(300)
await reload('/login')
check('refresh while signed out lands on /login', W.location.pathname === '/login' && !q('.sidebar'))

click(btn('Create account')); await wait(200)
await register('Brian Mwangi', 'brian@school.ke', 'brian1234', false)   // no starter data
const uidB = backend().currentUid
check('teacher B has a different uid', uidB && uidB !== uidA)

await wait(300)
check('teacher B sees an empty dashboard', qa('.stat')[0].textContent.includes('0'))
await gotoPage('students')
check('teacher B sees none of teacher A students', qa('.ecard').length === 0 && text().includes('No students yet'))
check("teacher A's names are absent from the DOM", !text().includes('Wanjiru') && !text().includes('Emma Wilson'))
await gotoPage('classes')
check('teacher B sees none of teacher A classes', qa('.ecard').length === 0)

// teacher B creates their own class
click(q('.page-head .btn')); await wait(200)
setVal(q('#cname'), 'Form 2 Chemistry')
setVal(q('#cdesc'), 'Practicals and revision')
submit(q('.modal form')); await wait(400)
check('teacher B can create their own class', qa('.ecard').length === 1)
const bClass = [...backend().docs.values()].find((d) => d.name === 'Form 2 Chemistry')
check('teacher B class stamped with their own uid', bClass.teacherId === uidB)

check('teacher A data still intact and untouched',
  [...backend().docs.values()].filter((d) => d.teacherId === uidA).length === docsA)
check('no cross-teacher rule violations attempted', backend().denied.length === 0,
  JSON.stringify(backend().denied))

let pass = 0
for (const [n, ok, extra] of results) { console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ok ? '' : '  <- ' + extra)); if (ok) pass++ }
console.log(`\n${pass}/${results.length} teacher-data checks passed`)
process.exit(pass === results.length ? 0 : 1)
