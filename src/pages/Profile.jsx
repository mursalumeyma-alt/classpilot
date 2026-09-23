import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { timeAgo } from '../utils/format'
import Modal from '../components/ui/Modal'
import { User, Mail, Lock, Shield, Camera, Trash } from '../components/ui/Icon'

export default function Profile() {
  const { user, updateDisplayName, changeEmail, changePassword, deleteAccount } = useAuth()
  const { students, classes, deleteAllTeacherData } = useData()
  const toast = useToast()
  const navigate = useNavigate()

  const [dialog, setDialog] = useState(null) // 'profile' | 'password' | 'delete'
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const [profileForm, setProfileForm] = useState({
    name: user.displayName || '',
    email: user.email || '',
    password: '',
  })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [deletePassword, setDeletePassword] = useState('')

  const emailChanged = profileForm.email.trim() !== user.email

  const openProfile = () => {
    setProfileForm({ name: user.displayName || '', email: user.email || '', password: '' })
    setDialogError('')
    setDialog('profile')
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setDialogError('')
    setBusy(true)

    if (profileForm.name.trim() !== user.displayName) {
      const res = await updateDisplayName(profileForm.name)
      if (res.error) { setBusy(false); return setDialogError(res.error) }
    }
    // Firebase requires a recent sign-in before an email change, so we ask
    // for the password rather than letting the request fail.
    if (emailChanged) {
      if (!profileForm.password) { setBusy(false); return setDialogError('Enter your password to change your email address.') }
      const res = await changeEmail(profileForm.email, profileForm.password)
      if (res.error) { setBusy(false); return setDialogError(res.error) }
    }

    setBusy(false)
    setDialog(null)
    toast('Profile updated.')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setDialogError('')
    setBusy(true)
    const res = await changePassword(pwForm)
    setBusy(false)
    if (res.error) return setDialogError(res.error)
    setPwForm({ current: '', next: '', confirm: '' })
    setDialog(null)
    toast('Password changed.')
  }

  const removeAccount = async (e) => {
    e.preventDefault()
    setDialogError('')
    setBusy(true)
    try {
      // Remove the teacher's documents first — once the account is gone the
      // rules would reject the writes.
      await deleteAllTeacherData()
    } catch (err) {
      console.error('Could not delete teacher data:', err)
      setBusy(false)
      return setDialogError('Could not delete your data. Try again.')
    }
    const res = await deleteAccount(deletePassword)
    setBusy(false)
    if (res.error) return setDialogError(res.error)
    toast('Account deleted.')
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h3>Profile settings</h3>
          <p>Manage your account information and preferences</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="pcard">
          <div className="pava"><User size={64} /></div>
          <h5>{user.displayName || 'Your account'}</h5>
          <p className="em">{user.email}</p>
          <button className="btn btn-ghost" onClick={() => toast('Photo uploads need Firebase Storage — not turned on yet.')}>
            <Camera size={18} /> Change photo
          </button>
          <div style={{ marginTop: 26, textAlign: 'left' }}>
            <div className="perf"><span>Students</span><b>{students.length}</b></div>
            <div className="perf"><span>Classes</span><b>{classes.length}</b></div>
          </div>
        </div>

        <div className="col">
          <section className="card">
            <div className="head-row">
              <h4>Personal information</h4>
              <button className="btn btn-ghost" onClick={openProfile}>Edit profile</button>
            </div>
            <div style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label" htmlFor="ro-name">Full name</label>
                <div className="control">
                  <span className="lead"><User size={20} /></span>
                  <input className="inp" id="ro-name" value={user.displayName || ''} readOnly />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="ro-email">Email address</label>
                <div className="control">
                  <span className="lead"><Mail size={20} /></span>
                  <input className="inp" id="ro-email" value={user.email || ''} readOnly />
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h4>Security settings</h4>
            <div className="srow">
              <span className="si" style={{ background: 'linear-gradient(140deg,#16a34a,#22c55e)' }}><Lock size={20} /></span>
              <span className="grow">
                <b>Password</b>
                <span>Last signed in {timeAgo(user.metadata?.lastSignInTime)}</span>
              </span>
              <button className="btn btn-ghost" onClick={() => { setDialogError(''); setDialog('password') }}>Change password</button>
            </div>
            <div className="srow">
              <span className="si" style={{ background: 'linear-gradient(140deg,#2563eb,#3b82f6)' }}><Shield size={20} /></span>
              <span className="grow">
                <b>Two-factor authentication</b>
                <span>Needs Firebase multi-factor auth on the Blaze plan</span>
              </span>
              <button className="btn btn-ghost" onClick={() => toast('Multi-factor auth isn\u2019t turned on for this project yet.')}>
                Turn on 2FA
              </button>
            </div>
          </section>

          <section className="card">
            <h4>Account management</h4>
            <div className="danger-box">
              <div className="dh"><Trash size={20} /> Delete account</div>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button className="btn btn-danger" onClick={() => { setDeletePassword(''); setDialogError(''); setDialog('delete') }}>
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>

      {dialog === 'profile' && (
        <Modal title="Edit profile" description="Update how your name and email appear in ClassPilot." onClose={() => setDialog(null)}>
          <form onSubmit={saveProfile}>
            <div className="field">
              <label className="label" htmlFor="pname">Full name <span className="req">*</span></label>
              <div className="control">
                <span className="lead"><User size={20} /></span>
                <input className="inp" id="pname" required autoFocus value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="pemail">Email address <span className="req">*</span></label>
              <div className="control">
                <span className="lead"><Mail size={20} /></span>
                <input className="inp" id="pemail" type="email" required value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            {emailChanged && (
              <div className="field">
                <label className="label" htmlFor="pconfirmpw">Current password <span className="req">*</span></label>
                <div className="control">
                  <span className="lead"><Lock size={20} /></span>
                  <input className="inp" id="pconfirmpw" type="password" value={profileForm.password}
                    onChange={(e) => setProfileForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Needed to change your email" autoComplete="current-password" />
                </div>
              </div>
            )}
            {dialogError && <div className="err" role="alert">{dialogError}</div>}
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === 'password' && (
        <Modal title="Change password" description="Use at least 6 characters." onClose={() => setDialog(null)}>
          <form onSubmit={savePassword}>
            {['current', 'next', 'confirm'].map((k, i) => (
              <div className="field" key={k}>
                <label className="label" htmlFor={`pw-${k}`}>
                  {k === 'current' ? 'Current password' : k === 'next' ? 'New password' : 'Confirm new password'}
                </label>
                <div className="control">
                  <span className="lead"><Lock size={20} /></span>
                  <input className="inp" id={`pw-${k}`} type="password" required autoFocus={i === 0}
                    autoComplete={k === 'current' ? 'current-password' : 'new-password'}
                    value={pwForm[k]} onChange={(e) => setPwForm((f) => ({ ...f, [k]: e.target.value }))} />
                </div>
              </div>
            ))}
            {dialogError && <div className="err" role="alert">{dialogError}</div>}
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === 'delete' && (
        <Modal
          title="Delete your account?"
          description="Every student, class and message in ClassPilot will be permanently deleted. This cannot be undone."
          onClose={() => setDialog(null)}
        >
          <form onSubmit={removeAccount}>
            <div className="field">
              <label className="label" htmlFor="delpw">Confirm your password <span className="req">*</span></label>
              <div className="control">
                <span className="lead"><Lock size={20} /></span>
                <input className="inp" id="delpw" type="password" required autoFocus value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" />
              </div>
            </div>
            {dialogError && <div className="err" role="alert">{dialogError}</div>}
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? 'Deleting…' : 'Delete account'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
