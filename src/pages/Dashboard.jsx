import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import StatCard from '../components/dashboard/StatCard'
import Calendar from '../components/dashboard/Calendar'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import ReminderList from '../components/dashboard/ReminderList'
import PerformanceSummary from '../components/dashboard/PerformanceSummary'
import StudentForm from '../components/students/StudentForm'
import ClassForm from '../components/classes/ClassForm'
import { Users, Book, Clock, Trend, Plus } from '../components/ui/Icon'

export default function Dashboard() {
  const { students, classes, reminders, rosterOf, loading } = useData()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(null) // 'student' | 'class' | null

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading your classroom…</p>

  return (
    <>
      <div className="stats">
        <StatCard tone="blue" icon={<Users size={24} />} label="Total students" value={students.length} caption="Across all classes" />
        <StatCard tone="violet" icon={<Book size={24} />} label="My classes" value={classes.length} caption="Active this semester" />
        <StatCard tone="orange" icon={<Clock size={24} />} label="Pending tasks" value={reminders.length} caption="Need attention" />
        <StatCard tone="green" icon={<Trend size={24} />} label="Class average" value="85%" caption="This semester" />
      </div>

      <div className="dash-grid">
        <div className="col">
          <section className="card">
            <h4>Quick actions</h4>
            <div className="quick">
              <button className="btn btn-blue" onClick={() => setAdding('student')}><Plus size={20} /> Add new student</button>
              <button className="btn btn-violet" onClick={() => setAdding('class')}><Plus size={20} /> Create new class</button>
            </div>
          </section>

          <ActivityFeed />

          <section className="card">
            <div className="head-row">
              <h4>Class overview</h4>
              <button className="view-all" onClick={() => navigate('/classes')}>View all classes</button>
            </div>
            <div className="mini-classes">
              {classes.length === 0 && <p style={{ color: 'var(--muted)', margin: 0 }}>No classes yet.</p>}
              {classes.slice(0, 4).map((c) => {
                const count = rosterOf(c.id).length
                return (
                  <button className="mini-class" key={c.id} onClick={() => navigate(`/classes?open=${c.id}`)}>
                    <div className="top">
                      <span className="ci"><Book size={22} /></span>
                      <span>
                        <b>{c.name}</b>
                        <span className="cnt">{count} {count === 1 ? 'student' : 'students'}</span>
                      </span>
                    </div>
                    <p>{c.description}</p>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="col">
          <Calendar />
          <ReminderList />
          <PerformanceSummary percent={85} />
        </div>
      </div>

      {adding === 'student' && <StudentForm onClose={() => setAdding(null)} />}
      {adding === 'class' && <ClassForm onClose={() => setAdding(null)} />}
    </>
  )
}
