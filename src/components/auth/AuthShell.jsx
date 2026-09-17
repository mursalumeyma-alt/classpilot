import { Link } from 'react-router-dom'
import { Cap, Spark, User, Mail } from '../ui/Icon'

/**
 * The shared login/register chrome from the reference design: brandmark,
 * wordmark, tab pair, feature strip. The two pages only supply their form.
 */
export default function AuthShell({ active, children }) {
  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="brandmark">
          <Cap size={56} />
          <span className="spark"><Spark size={16} /></span>
        </div>
        <h1 className="auth-title">ClassPilot</h1>
        <p className="auth-tag">Teaching made magical</p>
        <p className="auth-sub">Empowering educators, inspiring students</p>

        <div className="auth-card">
          <div className="tabs">
            <Link to="/login" className={`tab ${active === 'login' ? 'on' : ''}`} aria-current={active === 'login' ? 'page' : undefined}>
              Sign in
            </Link>
            <Link to="/register" className={`tab ${active === 'register' ? 'on' : ''}`} aria-current={active === 'register' ? 'page' : undefined}>
              Create account
            </Link>
          </div>

          {children}

          <div className="feature-strip">
            <div>
              <div className="fi" style={{ background: 'linear-gradient(140deg,#3b82f6,#2563eb)' }}><User size={20} /></div>
              <span>Student management</span>
            </div>
            <div>
              <div className="fi" style={{ background: 'linear-gradient(140deg,#8b5cf6,#7c3aed)' }}><Cap size={20} /></div>
              <span>Class organization</span>
            </div>
            <div>
              <div className="fi" style={{ background: 'linear-gradient(140deg,#fb923c,#ea580c)' }}><Mail size={20} /></div>
              <span>Communication</span>
            </div>
          </div>
        </div>

        <p className="auth-foot">Trusted by educators worldwide</p>
      </div>
    </div>
  )
}
