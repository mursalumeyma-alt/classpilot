/**
 * Negative control for the test harness.
 *
 * The other suites assert that the app never trips an ownership rule. That
 * only means something if the rules can actually reject — so here we make the
 * forbidden calls directly against the doubles and assert they fail. These
 * mirror the conditions in firestore.rules; deploy that file and use
 * @firebase/rules-unit-testing against the emulator to test the real rules.
 */
import * as auth from './fakes/firebase-auth.js'
import * as fs from './fakes/firebase-firestore.js'
import { backend } from './fakes/state.js'

const results = []
const check = (n, ok) => results.push([n, ok])
const denied = async (fn) => {
  try { await fn(); return false } catch (e) { return e.code === 'permission-denied' }
}

const a = auth.getAuth()
const db = fs.getFirestore()

await auth.createUserWithEmailAndPassword(a, 'one@school.ke', 'pass1234')
const uidA = backend().currentUid
await fs.addDoc(fs.collection(db, 'students'), { teacherId: uidA, name: 'A student' })

await auth.createUserWithEmailAndPassword(a, 'two@school.ke', 'pass1234')
const uidB = backend().currentUid

check('a teacher can read their own collection', (() => {
  let seen = null
  fs.onSnapshot(fs.query(fs.collection(db, 'students'), fs.where('teacherId', '==', uidB)), (s) => { seen = s })
  return true
})())

check('unscoped query is rejected', await denied(async () => {
  await new Promise((res, rej) => {
    fs.onSnapshot(fs.query(fs.collection(db, 'students')), () => res(), rej)
  })
}))

check('query scoped to another teacher is rejected', await denied(async () => {
  await new Promise((res, rej) => {
    fs.onSnapshot(fs.query(fs.collection(db, 'students'), fs.where('teacherId', '==', uidA)), () => res(), rej)
  })
}))

check('creating a document owned by another teacher is rejected',
  await denied(() => fs.addDoc(fs.collection(db, 'students'), { teacherId: uidA, name: 'Sneaky' })))

const [foreignKey] = [...backend().docs.entries()].find(([, d]) => d.teacherId === uidA)
const foreignRef = fs.doc(db, 'students', foreignKey.split('/')[1])

check("updating another teacher's document is rejected",
  await denied(() => fs.updateDoc(foreignRef, { name: 'Renamed' })))

check("deleting another teacher's document is rejected",
  await denied(() => fs.deleteDoc(foreignRef)))

check('reassigning teacherId to someone else is rejected', await denied(async () => {
  const ref = await fs.addDoc(fs.collection(db, 'students'), { teacherId: uidB, name: 'Mine' })
  await fs.updateDoc(fs.doc(db, 'students', ref.id), { teacherId: uidA })
}))

await auth.signOut()
check('signed-out read is rejected', await denied(async () => {
  await new Promise((res, rej) => {
    fs.onSnapshot(fs.query(fs.collection(db, 'students'), fs.where('teacherId', '==', uidB)), () => res(), rej)
  })
}))
check('signed-out write is rejected',
  await denied(() => fs.addDoc(fs.collection(db, 'students'), { teacherId: uidB, name: 'Ghost' })))

let pass = 0
for (const [n, ok] of results) { console.log((ok ? 'PASS  ' : 'FAIL  ') + n); if (ok) pass++ }
console.log(`\n${pass}/${results.length} ownership checks passed`)
process.exit(pass === results.length ? 0 : 1)
