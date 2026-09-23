import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from './AuthContext'
import { todayISO } from '../utils/format'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const COLLECTIONS = ['students', 'classes', 'reminders', 'activity', 'threads']
const EMPTY = { students: [], classes: [], reminders: [], activity: [], threads: [] }

/**
 * Every document carries `teacherId`, and every query filters on the signed-in
 * teacher's uid, so one teacher's app never asks for another's rows. The
 * matching Firestore rules in firestore.rules enforce the same thing on the
 * server, which is what actually stops a crafted request.
 *
 * Students and classes stay many-to-many via `student.classIds: string[]` —
 * the join is stored once, on the student document.
 */
export function DataProvider({ children }) {
  const { uid } = useAuth()
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setData(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const pending = new Set(COLLECTIONS)

    const unsubscribers = COLLECTIONS.map((name) =>
      onSnapshot(
        query(collection(db, name), where('teacherId', '==', uid)),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setData((prev) => ({ ...prev, [name]: sortFor(name, rows) }))
          pending.delete(name)
          if (pending.size === 0) setLoading(false)
        },
        (error) => {
          // Usually a rules rejection or a dropped connection.
          console.error(`Firestore listener for "${name}" failed:`, error)
          pending.delete(name)
          if (pending.size === 0) setLoading(false)
        }
      )
    )
    return () => unsubscribers.forEach((fn) => fn())
  }, [uid])

  const { students, classes, reminders, activity, threads } = data

  const owned = useCallback((fields) => ({ ...fields, teacherId: uid }), [uid])

  const logActivity = useCallback((kind, title, desc) => {
    if (!uid) return
    addDoc(collection(db, 'activity'), owned({ kind, title, desc, at: new Date().toISOString() }))
      .catch((e) => console.error('Could not log activity:', e))
  }, [uid, owned])

  /* ---------------- relationship helpers ---------------- */
  const rosterOf = useCallback(
    (classId) => students.filter((s) => (s.classIds || []).includes(classId)),
    [students]
  )
  const classesOf = useCallback(
    (student) => (student?.classIds || []).map((id) => classes.find((c) => c.id === id)).filter(Boolean),
    [classes]
  )
  const classNamesOf = useCallback((student) => classesOf(student).map((c) => c.name), [classesOf])

  /** Replace the set of classes one student belongs to. */
  const setStudentClasses = useCallback(async (studentId, classIds) => {
    await updateDoc(doc(db, 'students', studentId), { classIds: [...classIds] })
  }, [])

  /** Replace a class roster from the class side — writes the same join. */
  const setClassRoster = useCallback(async (classId, studentIds) => {
    const batch = writeBatch(db)
    let touched = 0
    students.forEach((s) => {
      const has = (s.classIds || []).includes(classId)
      const wants = studentIds.includes(s.id)
      if (has === wants) return
      const next = wants
        ? [...(s.classIds || []), classId]
        : (s.classIds || []).filter((x) => x !== classId)
      batch.update(doc(db, 'students', s.id), { classIds: next })
      touched += 1
    })
    if (touched) await batch.commit()
  }, [students])

 /* ---------------- students ---------------- */

const addStudent = useCallback(async (input) => {
  if (!uid) {
    throw new Error('You must be signed in to add a student.')
  }

  const payload = owned({
    joined: todayISO(),
    classIds: [],
    ...input,
  })

  console.log('ADDING STUDENT:', payload)

  try {
    const ref = await addDoc(
      collection(db, 'students'),
      payload
    )

    console.log('STUDENT ADDED:', ref.id)

    const firstClass = (input.classIds || [])
      .map((id) => classes.find((c) => c.id === id)?.name)
      .filter(Boolean)[0]

    logActivity(
      'student',
      'New student enrolled',
      `${input.name} joined ${firstClass || 'your roster'}`
    )

    return {
      id: ref.id,
      ...payload,
    }
  } catch (error) {
    console.error('FAILED TO ADD STUDENT:', error)
    throw error
  }
}, [uid, owned, classes, logActivity])


const updateStudent = useCallback(async (id, patch) => {
  try {
    await updateDoc(
      doc(db, 'students', id),
      patch
    )

    logActivity(
      'student',
      'Student updated',
      `${patch.name}’s details were updated`
    )
  } catch (error) {
    console.error('FAILED TO UPDATE STUDENT:', error)
    throw error
  }
}, [logActivity])


const deleteStudent = useCallback(async (id) => {
  try {
    const student = students.find((s) => s.id === id)

    await deleteDoc(
      doc(db, 'students', id)
    )

    if (student) {
      logActivity(
        'student',
        'Student removed',
        `${student.name} was removed from the roster`
      )
    }
  } catch (error) {
    console.error('FAILED TO DELETE STUDENT:', error)
    throw error
  }
}, [students, logActivity])
/* ---------------- classes ---------------- */

const addClass = useCallback(async (input) => {
  const payload = owned({
    created: todayISO(),
    description: 'No description yet.',
    ...input,
  })

  console.log('ADDING CLASS:', payload)

  const ref = await addDoc(collection(db, 'classes'), payload)

  console.log('CLASS ADDED:', ref.id)

  logActivity(
    'class',
    'Class created',
    `${input.name} class was created`
  )

  return { id: ref.id, ...payload }
}, [owned, logActivity])

const updateClass = useCallback(async (id, patch) => {
  await updateDoc(doc(db, 'classes', id), patch)

  logActivity(
    'class',
    'Class updated',
    `${patch.name} was updated`
  )
}, [logActivity])

/** Deleting a class also detaches it from every student that referenced it. */

const deleteClass = useCallback(async (id) => {
  const c = classes.find((x) => x.id === id)

  const batch = writeBatch(db)

  batch.delete(doc(db, 'classes', id))

  students
    .filter((s) => (s.classIds || []).includes(id))
    .forEach((s) =>
      batch.update(doc(db, 'students', s.id), {
        classIds: (s.classIds || []).filter((x) => x !== id),
      })
    )

  await batch.commit()

  if (c) {
    logActivity(
      'class',
      'Class deleted',
      `${c.name} was deleted`
    )
  }
}, [classes, students, logActivity])
  /* ---------------- reminders + messages ---------------- */
  const addReminder = useCallback(async (input) => {
    await addDoc(collection(db, 'reminders'), owned(input))
  }, [owned])

  const deleteReminder = useCallback(async (id) => {
    await deleteDoc(doc(db, 'reminders', id))
  }, [])

  const sendMessage = useCallback(async (threadId, text) => {
    const thread = threads.find((t) => t.id === threadId)
    if (!thread) return
    await updateDoc(doc(db, 'threads', threadId), { msgs: [...thread.msgs, { from: 'me', text }] })
  }, [threads])

  /** Removes every document this teacher owns. Used before account deletion. */
  const deleteAllTeacherData = useCallback(async () => {
    const batch = writeBatch(db)
    COLLECTIONS.forEach((name) => {
      data[name].forEach((row) => batch.delete(doc(db, name, row.id)))
    })
    await batch.commit()
  }, [data])

  const value = useMemo(() => ({
    students, classes, reminders, activity, threads, loading,
    rosterOf, classesOf, classNamesOf, setStudentClasses, setClassRoster,
    addStudent, updateStudent, deleteStudent,
    addClass, updateClass, deleteClass,
    addReminder, deleteReminder, sendMessage, deleteAllTeacherData,
  }), [students, classes, reminders, activity, threads, loading,
       rosterOf, classesOf, classNamesOf, setStudentClasses, setClassRoster,
       addStudent, updateStudent, deleteStudent, addClass, updateClass, deleteClass,
       addReminder, deleteReminder, sendMessage, deleteAllTeacherData])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

/** Firestore returns documents unordered; keep the UI stable and predictable. */
function sortFor(name, rows) {
  if (name === 'activity') return [...rows].sort((a, b) => String(b.at).localeCompare(String(a.at)))
  if (name === 'students' || name === 'classes') {
    return [...rows].sort((a, b) => String(b.joined || b.created || '').localeCompare(String(a.joined || a.created || '')))
  }
  if (name === 'reminders') return [...rows].sort((a, b) => String(a.due).localeCompare(String(b.due)))
  return rows
}
