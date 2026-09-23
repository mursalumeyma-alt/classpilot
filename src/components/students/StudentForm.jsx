import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../ui/Modal'

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']

/**
 * One form for both create and edit. Class assignment is a checkbox list,
 * which is what makes a student able to sit in several classes at once.
 */
export default function StudentForm({ student, onClose }) {
  const { classes, addStudent, updateStudent, setStudentClasses } = useData()
  const toast = useToast()
  const editing = Boolean(student)

  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    age: student?.age || '',
    gender: student?.gender || GENDERS[0],
    notes: student?.notes || '',
  })
  const [classIds, setClassIds] = useState(student?.classIds || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleClass = (id) =>
    setClassIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

 const submit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      age: Number(form.age),
      gender: form.gender,
      notes: form.notes.trim (),
      classIds,
    }
    setBusy(true)
    try {
      if (editing) {
        await updateStudent(student.id, payload)
        await setStudentClasses(student.id, classIds)
        toast('Student updated.')
       } else {
  addStudent(payload).catch((err) => {
    console.error('Student save error:', err)
  })
  toast('Student added.')
}
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not save this student. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit student' : 'Add student'}
      description={editing ? 'Update this student\u2019s details and class assignments.' : 'Add a student to your roster and assign them to classes.'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-2">
          <div className="field">
            <label className="label" htmlFor="sname">Full name <span className="req">*</span></label>
            <input className="inp" id="sname" required autoFocus value={form.name} onChange={set('name')} placeholder="Emma Wilson" />
          </div>
          <div className="field">
            <label className="label" htmlFor="semail">Email</label>
            <input className="inp" id="semail" type="email" value={form.email} onChange={set('email')} placeholder="emma.wilson@student.edu" />
          </div>
          <div className="field">
            <label className="label" htmlFor="sage">Age <span className="req">*</span></label>
            <input className="inp" id="sage" type="number" min="3" max="25" required value={form.age} onChange={set('age')} placeholder="8" />
          </div>
          <div className="field">
            <label className="label" htmlFor="sgender">Gender</label>
            <select className="inp" id="sgender" value={form.gender} onChange={set('gender')}>
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Classes</label>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>No classes yet. Create one first to assign students.</p>
          ) : (
            <div className="check-list">
              {classes.map((c) => (
                <label className="check" key={c.id}>
                  <input type="checkbox" checked={classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="snotes">Notes</label>
          <textarea className="inp" id="snotes" value={form.notes} onChange={set('notes')} placeholder="Strengths, support needs, anything to remember" />
        </div>

        {error && <div className="err" role="alert">{error}</div>}

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
