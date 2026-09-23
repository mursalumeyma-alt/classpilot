import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthShell from '../components/auth/AuthShell'
import PasswordField from '../components/auth/PasswordField'
import { Mail } from '../components/ui/Icon'

export default function Login() {
  const { login, configError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Send them back to whatever protected page they originally asked for.
  const destination = location.state?.from?.pathname || '/dashboard'

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.trim()) return setError('Enter your email address.')
    if (!form.password) return setError('Enter your password.')

    setBusy(true)
    const result = await login(form)
    setBusy(false)

    if (result.error) return setError(result.error)
    navigate(destination, { replace: true })
  }

  return (
    <AuthShell active="login">
      {configError && <div className="err" role="alert">{configError}</div>}
      {!configError && error && <div className="err" role="alert">{error}</div>}

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label className="label" htmlFor="email">Email address <span className="req">*</span></label>
          <div className="control">
            <span className="lead"><Mail size={20} /></span>
            <input className="inp" id="email" type="email" required value={form.email}
              onChange={set('email')} placeholder="teacher@gmail.com" autoComplete="email" />
          </div>
        </div>

        <PasswordField id="password" label="Password" value={form.password}
          onChange={set('password')} autoComplete="current-password" placeholder="Your password" />

        <button className="btn btn-grad" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in to ClassPilot'}
        </button>
      </form>

      <button className="link-center" onClick={() => toast('Password reset is not turned on yet.')}>
        Forgot your password?
      </button>
    </AuthShell>
  )
}
