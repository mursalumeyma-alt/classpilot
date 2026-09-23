import { useState } from 'react'
import { Lock, Eye, EyeOff } from '../ui/Icon'

export default function PasswordField({ id, label, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label} <span className="req">*</span></label>
      <div className="control has-trail">
        <span className="lead"><Lock size={20} /></span>
        <input
          className="inp"
          id={id}
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button type="button" className="trail" onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  )
}
