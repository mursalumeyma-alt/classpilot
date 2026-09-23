import { useData } from '../../context/DataContext'
import { fdate } from '../../utils/format'
import { Book, Users, Pencil, Trash, Arrow, Calendar } from '../ui/Icon'

export default function ClassCard({ klass, onOpen, onEdit, onDelete }) {
  const { rosterOf } = useData()
  const count = rosterOf(klass.id).length

  return (
    <article className="ecard">
      <div className="ehead">
        <span className="bookicon"><Book size={26} /></span>
        <div className="grow">
          <h5>{klass.name}</h5>
          <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Users size={17} /> {count} {count === 1 ? 'student' : 'students'}
          </div>
        </div>
        <div className="acts">
          <button className="act" onClick={onEdit} aria-label={`Edit ${klass.name}`}><Pencil size={19} /></button>
          <button className="act del" onClick={onDelete} aria-label={`Delete ${klass.name}`}><Trash size={19} /></button>
        </div>
      </div>

      <p className="desc">{klass.description}</p>

      <div className="foot">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} /> {fdate(klass.created)}
        </span>
        <button className="go" onClick={onOpen}>View details <Arrow size={15} /></button>
      </div>
    </article>
  )
}
