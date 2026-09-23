import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../ui/Modal'

/**
 * The mirror image of StudentForm: here the roster is edited from the class
 * side, but it writes to the same student.classIds join.
 */
export default function ClassForm({ klass, onClose }) {
  const { students, addClass, updateClass, setClassRoster, rosterOf } = useData()
  const toast = useToast()
  const editing = Boolean(klass)

  const [form, setForm] = useState({
    name: klass?.name || '',
    description: klass?.description || '',
  })
  const [roster, setRoster] = useState(() => (klass ? rosterOf(klass.id).map((s) => s.id) : []))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleStudent = (id) =>
    setRoster((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || 'No description yet.',
    }
    setBusy(true)
    try {
      let id = klass?.id
      if (editing) await updateClass(id, payload)
      else id = (await addClass(payload)).id
      await setClassRoster(id, roster)
      toast(editing ? 'Class updated.' : 'Class created.')
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not save this class. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit class' : 'Create class'}
      description={editing ? 'Update the class name, description and roster.' : 'Name the class, describe it, then pick who\u2019s in it.'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="cname">Class name <span className="req">*</span></label>
          <input className="inp" id="cname" required autoFocus value={form.name} onChange={set('name')} placeholder="3rd Grade Mathematics" />
        </div>

        <div className="field">
          <label className="label" htmlFor="cdesc">Description</label>
          <textarea className="inp" id="cdesc" value={form.description} onChange={set('description')} placeholder="What this class covers" />
        </div>

        <div className="field">
          <label className="label">Students in this class</label>
          {students.length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>No students yet. Add students first, then assign them here.</p>
          ) : (
            <div className="check-list">
              {students.map((s) => (
                <label className="check" key={s.id}>
                  <input type="checkbox" checked={roster.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                  <span>{s.name} <span style={{ color: 'var(--muted)' }}>· {s.age}</span></span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <div className="err" role="alert">{error}</div>}

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create class'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
