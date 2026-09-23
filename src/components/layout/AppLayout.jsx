import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Close the mobile drawer and scroll to top whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // The drawer overlay styles hang off a body class so the scrim can cover
  // the whole viewport regardless of where the sidebar sits in the tree.
  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen)
    return () => document.body.classList.remove('nav-open')
  }, [navOpen])

  const handleSignOut = async () => {
    await logout()
    // Firebase clears the session; the redirect just moves the UI along.
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <div className="sb-scrim" onClick={() => setNavOpen(false)} />
      <Sidebar onNavigate={() => setNavOpen(false)} onSignOut={handleSignOut} />
      <div className="main">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
