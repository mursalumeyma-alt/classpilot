import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

/**
 * Optional starter content for a brand-new teacher, so the dashboard isn't
 * empty on first login. Every document is stamped with the teacher's own uid,
 * exactly like data they create themselves — this is real data in their
 * account, not a demo mode.
 */
export async function seedTeacherData(uid) {
  if (!uid) return

  const batch = writeBatch(db)
  const ref = (name) => doc(collection(db, name))

  const math = ref('classes')
  const science = ref('classes')
  const reading = ref('classes')

  batch.set(math, { teacherId: uid, name: '3rd Grade Mathematics', description: 'Advanced mathematics for 3rd grade students focusing on multiplication, division and problem solving.', created: '2024-01-09' })
  batch.set(science, { teacherId: uid, name: '4th Grade Science', description: 'Exploring the natural world through hands-on experiments and observations.', created: '2024-01-11' })
  batch.set(reading, { teacherId: uid, name: '3rd Grade Reading', description: 'Building reading comprehension and vocabulary through engaging literature.', created: '2024-01-14' })

  const students = [
    { name: 'Emma Wilson', age: 8, gender: 'Female', email: 'emma.wilson@student.edu', notes: 'Loves word problems. Needs extra time on timed drills.', classIds: [math.id], joined: '2024-01-14' },
    { name: 'Liam Chen', age: 9, gender: 'Male', email: 'liam.chen@student.edu', notes: 'Strong mental maths. Quiet in group work.', classIds: [math.id], joined: '2024-01-15' },
    { name: 'Sophia Rodriguez', age: 8, gender: 'Female', email: 'sophia.rodriguez@student.edu', notes: 'Curious about weather experiments.', classIds: [science.id], joined: '2024-01-19' },
    { name: 'Noah Thompson', age: 10, gender: 'Male', email: 'noah.thompson@student.edu', notes: 'Peer mentor for lab safety.', classIds: [science.id], joined: '2024-01-21' },
    { name: 'Olivia Davis', age: 9, gender: 'Female', email: 'olivia.davis@student.edu', notes: 'Working on multiplication fluency.', classIds: [math.id, reading.id], joined: '2024-01-24' },
    { name: 'Ethan Johnson', age: 8, gender: 'Male', email: 'ethan.johnson@student.edu', notes: 'New to the reading group.', classIds: [reading.id], joined: '2024-01-31' },
  ]
  students.forEach((s) => batch.set(ref('students'), { teacherId: uid, ...s }))

  const reminders = [
    { title: 'Grade math tests', desc: 'Grade the multiplication tests from yesterday', due: '2024-03-14', priority: 'high' },
    { title: 'Parent-teacher conferences', desc: 'Prepare materials for upcoming conferences', due: '2024-03-17', priority: 'medium' },
    { title: 'Update lesson plans', desc: 'Update lesson plans for next week', due: '2024-03-15', priority: 'medium' },
  ]
  reminders.forEach((r) => batch.set(ref('reminders'), { teacherId: uid, ...r }))

  batch.set(ref('activity'), { teacherId: uid, kind: 'class', title: 'Welcome to ClassPilot', desc: 'Your starter classes and students are ready to edit', at: new Date().toISOString() })

  const threads = [
    { who: 'Dana Wilson', role: "Emma's parent", msgs: [
      { from: 'them', text: 'Hi — is Emma keeping up with the multiplication work?' },
    ] },
    { who: 'Marcus Chen', role: "Liam's parent", msgs: [
      { from: 'them', text: 'Thanks for the update on the science fair. What should Liam bring?' },
    ] },
    { who: 'Aisha Rahman', role: 'Reading co-teacher', msgs: [
      { from: 'them', text: 'Sharing the new vocabulary list for 3rd Grade Reading.' },
    ] },
  ]
  threads.forEach((t) => batch.set(ref('threads'), { teacherId: uid, ...t }))

  await batch.commit()
}
