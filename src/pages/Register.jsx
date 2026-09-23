import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthShell from '../components/auth/AuthShell'
import PasswordField from '../components/auth/PasswordField'
import { User, Mail } from '../components/ui/Icon'
import { seedTeacherData } from '../data/seed'

export default function Register() {
  const { register, configError } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [withStarter, setWithStarter] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Enter your full name.')
    if (!form.email.trim()) return setError('Enter your email address.')
    if (form.password.length < 6) return setError('Password needs at least 6 characters.')
    if (form.password !== form.confirm) return setError('The two passwords don\u2019t match.')

    setBusy(true)
    const result = await register(form)
    setBusy(false)

    if (result.error) return setError(result.error)

    if (withStarter) {
      // Written under the new teacher's own uid. A failure here shouldn't
      // block a successful registration.
      try {
        await seedTeacherData(result.user.uid)
      } catch (err) {
        console.error('Could not add starter content:', err)
      }
    }

    toast('Account created. Welcome to ClassPilot.')
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthShell active="register">
      {configError && <div className="err" role="alert">{configError}</div>}
      {!configError && error && <div className="err" role="alert">{error}</div>}

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label className="label" htmlFor="name">Full name <span className="req">*</span></label>
          <div className="control">
            <span className="lead"><User size={20} /></span>
            <input className="inp" id="name" required value={form.name} onChange={set('name')}
              placeholder="Sarah Johnson" autoComplete="name" />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="email">Email address <span className="req">*</span></label>
          <div className="control">
            <span className="lead"><Mail size={20} /></span>
            <input className="inp" id="email" type="email" required value={form.email}
              onChange={set('email')} placeholder="teacher@gmail.com" autoComplete="email" />
          </div>
        </div>

        <PasswordField id="password" label="Password" value={form.password}
          onChange={set('password')} autoComplete="new-password" placeholder="At least 6 characters" />

        <PasswordField id="confirm" label="Confirm password" value={form.confirm}
          onChange={set('confirm')} autoComplete="new-password" placeholder="Type it again" />

        <div className="field">
          <label className="check" style={{ padding: 0 }}>
            <input type="checkbox" checked={withStarter} onChange={(e) => setWithStarter(e.target.checked)} />
            <span>Start me off with sample classes and students</span>
          </label>
        </div>

        <button className="btn btn-grad" type="submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create your account'}
        </button>
      </form>
    </AuthShell>
  )
}
