import { Cap, Spark } from './Icon'

/**
 * Shown while Firebase restores the session. Without this, a refresh on
 * /dashboard would flash the login screen before the user is known.
 */
export default function LoadingScreen({ label = 'Checking your session…' }) {
  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="brandmark">
          <Cap size={56} />
          <span className="spark"><Spark size={16} /></span>
        </div>
        <h1 className="auth-title">ClassPilot</h1>
        <p className="auth-sub" style={{ marginBottom: 0 }} role="status">{label}</p>
      </div>
    </div>
  )
}
