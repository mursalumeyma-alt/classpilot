// Test double for `firebase/firestore`.
//
// It also enforces the ownership rules from firestore.rules, so the tests
// prove the app's queries and writes stay inside the signed-in teacher's own
// data. Anything that would be rejected by the real rules is recorded in
// backend().denied and thrown as 'permission-denied'.
import { backend, nextId, fbError } from './state.js'

const snapshotListeners = new Set()

const key = (col, id) => `${col}/${id}`
const currentUid = () => backend().currentUid

function denyUnlessOwner(action, col, data) {
  const uid = currentUid()
  if (!uid || !data || data.teacherId !== uid) {
    backend().denied.push({ action, col, teacherId: data?.teacherId, uid })
    throw fbError('permission-denied', `Missing or insufficient permissions on ${col}`)
  }
}

export function getFirestore() { return { type: 'firestore' } }

export function collection(_db, name) { return { type: 'collection', name } }

export function doc(a, b, c) {
  // doc(db, 'students', id) | doc(collectionRef) -> new id
  if (a?.type === 'collection') return { type: 'doc', col: a.name, id: nextId('doc') }
  return { type: 'doc', col: b, id: c }
}

export function where(field, op, value) { return { field, op, value } }

export function query(col, ...constraints) {
  return { type: 'query', name: col.name, constraints }
}

function runQuery(q) {
  const b = backend()
  const uid = currentUid()

  // Mirror the rules: a listener only survives if it's scoped to the caller.
  const scoped = q.constraints.some(
    (c) => c.field === 'teacherId' && c.op === '==' && c.value === uid
  )
  if (!uid || !scoped) {
    b.denied.push({ action: 'read', col: q.name, uid })
    throw fbError('permission-denied', `Unscoped read on ${q.name}`)
  }

  const docs = []
  for (const [k, data] of b.docs) {
    const [col, id] = k.split('/')
    if (col !== q.name) continue
    if (data.teacherId !== uid) continue
    docs.push({ id, data: () => ({ ...data }) })
  }
  return { docs }
}

export function onSnapshot(q, next, onError) {
  const entry = { q, next, onError }
  snapshotListeners.add(entry)
  const push = () => {
    try { entry.next(runQuery(entry.q)) }
    catch (e) { entry.onError?.(e) }
  }
  setTimeout(push, 0)
  entry.push = push
  return () => snapshotListeners.delete(entry)
}

function notify(col) {
  snapshotListeners.forEach((l) => { if (l.q.name === col) l.push() })
}

export async function addDoc(col, data) {
  denyUnlessOwner('create', col.name, data)
  const id = nextId('doc')
  backend().docs.set(key(col.name, id), { ...data })
  notify(col.name)
  return { id, ...col }
}

export async function setDoc(ref, data) {
  denyUnlessOwner('create', ref.col, data)
  backend().docs.set(key(ref.col, ref.id), { ...data })
  notify(ref.col)
}

export async function updateDoc(ref, patch) {
  const b = backend()
  const existing = b.docs.get(key(ref.col, ref.id))
  if (!existing) throw fbError('not-found')
  denyUnlessOwner('update', ref.col, existing)                      // owns existing
  denyUnlessOwner('update', ref.col, { ...existing, ...patch })     // owns incoming
  b.docs.set(key(ref.col, ref.id), { ...existing, ...patch })
  notify(ref.col)
}

export async function deleteDoc(ref) {
  const b = backend()
  const existing = b.docs.get(key(ref.col, ref.id))
  if (!existing) return
  denyUnlessOwner('delete', ref.col, existing)
  b.docs.delete(key(ref.col, ref.id))
  notify(ref.col)
}

export function writeBatch() {
  const ops = []
  return {
    set: (ref, data) => ops.push(['set', ref, data]),
    update: (ref, patch) => ops.push(['update', ref, patch]),
    delete: (ref) => ops.push(['delete', ref]),
    commit: async () => {
      const touched = new Set()
      for (const [kind, ref, payload] of ops) {
        if (kind === 'set') await setDoc(ref, payload)
        if (kind === 'update') await updateDoc(ref, payload)
        if (kind === 'delete') await deleteDoc(ref)
        touched.add(ref.col)
      }
      touched.forEach(notify)
    },
  }
}

export function serverTimestamp() { return new Date().toISOString() }
