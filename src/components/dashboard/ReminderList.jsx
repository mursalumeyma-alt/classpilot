import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fdate, todayISO } from '../../utils/format'
import Modal from '../ui/Modal'
import { Plus, Alert, Clock, Trash } from '../ui/Icon'

const BLANK = { title: '', desc: '', due: todayISO(), priority: 'medium' }

export default function ReminderList() {
  const { reminders, addReminder, deleteReminder } = useData()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(BLANK)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await addReminder({ ...form, desc: form.desc.trim() || 'No details added.' })
      setForm(BLANK)
      setOpen(false)
      toast('Reminder added.')
    } catch {
      toast('Could not save that reminder.')
    }
  }

  return (
    <section className="card">
      <div className="head-row">
        <h4>Upcoming reminders</h4>
        <button className="view-all" onClick={() => setOpen(true)}><Plus size={16} /> Add</button>
      </div>

      <div className="row-list">
        {reminders.length === 0 && (
          <p style={{ color: 'var(--muted)', margin: 0 }}>No reminders. Add one to keep the week on track.</p>
        )}
        {reminders.map((r) => (
          <div className="rem" key={r.id}>
            <span style={{ color: r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f59e0b' : '#22c55e' }}>
              {r.priority === 'high' ? <Alert size={20} /> : <Clock size={20} />}
            </span>
            <div style={{ flex: 1 }}>
              <b>{r.title}</b>
              <p>{r.desc}</p>
              <div className="due">
                <span>Due {fdate(r.due)}</span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`pill p-${r.priority}`}>{r.priority}</span>
                  <button className="act del" aria-label={`Delete reminder ${r.title}`}
                    onClick={async () => {
                      try { await deleteReminder(r.id); toast('Reminder removed.') }
                      catch { toast('Could not remove that reminder.') }
                    }}>
                    <Trash size={16} />
                  </button>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Add reminder" description="Keep track of what needs doing this week." onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="rt">Title <span className="req">*</span></label>
              <input className="inp" id="rt" required value={form.title} onChange={set('title')} placeholder="Grade math tests" />
            </div>
            <div className="field">
              <label className="label" htmlFor="rd">Details</label>
              <input className="inp" id="rd" value={form.desc} onChange={set('desc')} placeholder="Grade the multiplication tests from yesterday" />
            </div>
            <div className="form-2">
              <div className="field">
                <label className="label" htmlFor="rdue">Due date</label>
                <input className="inp" id="rdue" type="date" value={form.due} onChange={set('due')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="rp">Priority</label>
                <select className="inp" id="rp" value={form.priority} onChange={set('priority')}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add reminder</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
