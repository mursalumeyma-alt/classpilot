import { useData } from '../../context/DataContext'
import { fdate } from '../../utils/format'
import Modal from '../ui/Modal'
import { User, Pencil } from '../ui/Icon'

export default function ClassDetail({ klass, onClose, onEdit, onEditStudent }) {
  const { rosterOf } = useData()
  const roster = rosterOf(klass.id)

  return (
    <Modal title={klass.name} description={klass.description} onClose={onClose}>
      <div className="chips" style={{ marginBottom: 22 }}>
        <span className="chip">{roster.length} {roster.length === 1 ? 'student' : 'students'}</span>
        <span className="chip">Created {fdate(klass.created)}</span>
      </div>

      <h4 style={{ fontSize: 19, marginBottom: 12 }}>Roster</h4>
      <div className="row-list" style={{ marginTop: 0 }}>
        {roster.length === 0 && (
          <p style={{ color: 'var(--muted)', margin: 0 }}>No students assigned yet. Edit the class to add some.</p>
        )}
        {roster.map((s) => (
          <div className="roster-item" key={s.id}>
            <span className="avatar"><User size={20} /></span>
            <div className="grow">
              <b>{s.name}</b>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                {s.age} years old · {s.email || 'No email'}
              </div>
            </div>
            <button className="act" onClick={() => onEditStudent(s)} aria-label={`Edit ${s.name}`}>
              <Pencil size={19} />
            </button>
          </div>
        ))}
      </div>

      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onEdit}>Edit class</button>
      </div>
    </Modal>
  )
}
