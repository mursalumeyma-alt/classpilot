import { useData } from '../../context/DataContext'
import { ftime } from '../../utils/format'
import { Users, Book, Calendar } from '../ui/Icon'

const iconFor = (kind) =>
  kind === 'student' ? <Users size={20} /> : kind === 'class' ? <Book size={20} /> : <Calendar size={20} />

export default function ActivityFeed() {
  const { activity } = useData()

  return (
    <section className="card">
      <div className="head-row"><h4>Recent activity</h4></div>
      <div className="row-list">
        {activity.length === 0 && (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nothing yet. Add a student or create a class to get started.</p>
        )}
        {activity.slice(0, 6).map((a) => (
          <div className="row" key={a.id}>
            <span className="ri">{iconFor(a.kind)}</span>
            <div>
              <b>{a.title}</b>
              <p>{a.desc}</p>
              <time>{ftime(a.at)}</time>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
