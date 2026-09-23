import { Component } from 'react'
import { Cap, Spark } from './ui/Icon'

/**
 * Last line of defense against a blank page.
 *
 * React unmounts the entire tree after an uncaught error during render —
 * with no boundary, that means the #root div goes empty and the only trace
 * is a console error. This catches that and shows a real screen instead,
 * using the same shell as the login page so it doesn't look broken.
 *
 * The Firebase-config case is handled earlier, in AuthContext, with a
 * specific message. This boundary is for anything else that slips through.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ClassPilot crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="auth-screen">
        <div className="auth-wrap">
          <div className="brandmark">
            <Cap size={56} />
            <span className="spark"><Spark size={16} /></span>
          </div>
          <h1 className="auth-title">ClassPilot</h1>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 600, marginTop: 0 }}>Something went wrong.</p>
            <p style={{ color: 'var(--muted)' }}>
              Try reloading the page. If this keeps happening, check the browser console for details.
            </p>
            <button className="btn btn-grad" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
