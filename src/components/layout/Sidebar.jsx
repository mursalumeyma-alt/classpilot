import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Cap, Spark, Home, Users, Book, Chat, Gear, User, SignOut, ChevDown } from '../ui/Icon'

const NAV = [
  { to: '/dashboard', page: 'dashboard', label: 'Dashboard', icon: <Home /> },
  { to: '/students', page: 'students', label: 'Students', icon: <Users /> },
  { to: '/classes', page: 'classes', label: 'Classes', icon: <Book /> },
  { separator: true },
  { to: '/messages', page: 'messages', label: 'Messages', icon: <Chat /> },
  { to: '/profile', page: 'profile', label: 'Profile', icon: <Gear /> },
]

export default function Sidebar({ onNavigate, onSignOut }) {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">
          <Cap size={28} />
          <span className="spark"><Spark size={11} /></span>
        </div>
        <div>
          <h1>ClassPilot</h1>
          <p>Teaching made magical</p>
        </div>
      </div>

      <nav className="nav" aria-label="Main">
        {NAV.map((item, i) =>
          item.separator ? (
            <div className="nav-sep" key={`sep-${i}`} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              data-page={item.page}
              onClick={onNavigate}
              className={({ isActive }) => `nav-item ${isActive ? 'on' : ''}`}
            >
              <span className="ni">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="sb-foot">
        <NavLink to="/profile" className="sb-user" onClick={onNavigate}>
          <span className="sb-ava"><User size={24} /><span className="dot" /></span>
          <span className="grow">
            <b>Welcome back! 👋</b>
            <span>{user?.displayName || user?.email}</span>
          </span>
          <ChevDown size={18} />
        </NavLink>
        <button className="sb-signout" onClick={onSignOut}>
          <SignOut size={20} /> Sign out
        </button>
      </div>
    </aside>
  )
}
