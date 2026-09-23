import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { firstName } from '../../utils/format'
import { Menu, Bell, Chat } from '../ui/Icon'

export default function Topbar({ onOpenNav }) {
  const { user } = useAuth()
  const { reminders } = useData()
  const navigate = useNavigate()
  const toast = useToast()
  const [term, setTerm] = useState('')

  const submitSearch = (e) => {
    if (e.key !== 'Enter' || !term.trim()) return
    navigate(`/students?q=${encodeURIComponent(term.trim())}`)
    setTerm('')
  }

  return (
    <header className="topbar">
      <button className="burger" onClick={onOpenNav} aria-label="Open navigation"><Menu /></button>

    <div className="greet">
  <h2>Welcome back, Teacher 👋</h2>
  <p>Ready to inspire minds today?</p>
</div>

      <div className="grow" />

      <div className="search">
        <input
          type="search"
          aria-label="Search students and classes"
          placeholder="Search students, classes or notes"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={submitSearch}
        />
      </div>

      <button className="icon-btn" aria-label="Notifications" onClick={() => toast(`${reminders.length} reminders waiting on the dashboard.`)}>
        <Bell />
        {reminders.length > 0 && <span className="badge">{reminders.length}</span>}
      </button>
      <button className="icon-btn" aria-label="Messages" onClick={() => navigate('/messages')}>
        <Chat />
      </button>
    </header>
  )
}
