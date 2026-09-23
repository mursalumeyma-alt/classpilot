import { useData } from '../../context/DataContext'
import { fdate } from '../../utils/format'
import { User, Mail, Pencil, Trash } from '../ui/Icon'

export default function StudentCard({ student, onEdit, onDelete }) {
  const { classNamesOf } = useData()
  const names = classNamesOf(student)

  return (
    <article className="ecard">
      <div className="ehead">
        <span className="avatar"><User size={26} /></span>
        <div className="grow">
          <h5>{student.name}</h5>
          <div className="sub">{student.age} years old</div>
        </div>
        <div className="acts">
          <button className="act" onClick={onEdit} aria-label={`Edit ${student.name}`}><Pencil size={19} /></button>
          <button className="act del" onClick={onDelete} aria-label={`Delete ${student.name}`}><Trash size={19} /></button>
        </div>
      </div>

      <div className="meta">
        <span className="email"><Mail size={18} /> {student.email || 'No email on file'}</span>
        <span><span className="k">Class:</span> {names.length ? names.join(', ') : 'Not assigned'}</span>
        <span><span className="k">Gender:</span> {student.gender}</span>
        <span><span className="k">Joined:</span> {fdate(student.joined)}</span>
        {student.notes && <span><span className="k">Notes:</span> {student.notes}</span>}
      </div>
    </article>
  )
}
