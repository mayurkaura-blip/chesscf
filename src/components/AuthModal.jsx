import { useState } from 'react'
import * as api from '../utils/api'

const GoogleIcon = () => (
  <svg className="sso-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)
const FBIcon = () => (
  <svg className="sso-icon" viewBox="0 0 24 24" fill="white" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const EyeIcon = ({ show }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {show
      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
  </svg>
)

function pwStrength(pw) {
  if (!pw) return { w: 0, color: 'transparent', label: '' }
  let s = 0
  if (pw.length >= 8) s += 25; if (pw.length >= 12) s += 15
  if (/[A-Z]/.test(pw)) s += 20; if (/[0-9]/.test(pw)) s += 20
  if (/[^A-Za-z0-9]/.test(pw)) s += 20
  const color = s < 40 ? '#FF2D7E' : s < 70 ? '#FFD700' : '#00FF88'
  return { w: s, color, label: s < 40 ? 'Weak' : s < 70 ? 'Good' : 'Strong' }
}

export default function AuthModal({ tab, onClose, onSwitch, onLogin }) {
  const [form, setForm] = useState({ handle:'', email:'', password:'', confirm:'' })
  const [showPw, setShowPw]   = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const pw = pwStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('')
    if (tab === 'signup') {
      if (!form.handle || !form.email || !form.password) { setErr('All fields are required.'); return }
      if (form.handle.length < 3) { setErr('Handle must be at least 3 characters.'); return }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.handle)) { setErr('Handle: 3–20 chars, letters/numbers/underscores only.'); return }
      if (form.password !== form.confirm) { setErr('Passwords do not match.'); return }
      if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return }
    } else {
      if (!form.email || !form.password) { setErr('Email and password are required.'); return }
    }
    setLoading(true)
    try {
      let res
      if (tab === 'signup') {
        res = await api.auth.register({ handle: form.handle, email: form.email, password: form.password })
      } else {
        res = await api.auth.login({ emailOrHandle: form.email, password: form.password })
      }
      onLogin(res.user)
    } catch (e) {
      setErr(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBg = e => { if (e.target === e.currentTarget) onClose() }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true"
      aria-label={tab === 'signup' ? 'Create account' : 'Log in'}
      onClick={handleBg}>
      <div className="auth-modal">
        <div className="auth-top">
          <span className="auth-logo" aria-hidden="true">♟</span>
          <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="auth-tabs" role="tablist">
          <button role="tab" className={`auth-tab${tab==='signup'?' active':''}`}
            aria-selected={tab==='signup'} onClick={() => onSwitch('signup')}>Create Account</button>
          <button role="tab" className={`auth-tab${tab==='login'?' active':''}`}
            aria-selected={tab==='login'} onClick={() => onSwitch('login')}>Log In</button>
        </div>

        <div className="auth-body">
          {/* SSO buttons — trigger real OAuth2 redirect */}
          <div className="sso-col">
            <button className="sso-btn sso-g" type="button" onClick={api.auth.googleRedirect}>
              <GoogleIcon /> Continue with Google
            </button>
            <button className="sso-btn sso-f" type="button" onClick={api.auth.facebookRedirect}>
              <FBIcon /> Continue with Facebook
            </button>
          </div>

          <div className="auth-divider">or</div>

          <form style={{display:'flex',flexDirection:'column',gap:14}} onSubmit={handleSubmit} noValidate>
            {tab === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-handle">Handle / Username</label>
                <div className="input-wrap">
                  <span className="input-pfx" aria-hidden="true">@</span>
                  <input id="auth-handle" type="text" className="form-input pl"
                    placeholder="yourcoolhandle" maxLength={20}
                    value={form.handle} onChange={set('handle')}
                    autoComplete="username" spellCheck={false}/>
                </div>
                <span className="form-hint">3–20 chars · letters, numbers, underscores</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                {tab === 'login' ? 'Email or @handle' : 'Email address'}
              </label>
              <input id="auth-email" type={tab==='login'?'text':'email'} className="form-input"
                placeholder={tab==='login'?'email or @handle':'you@example.com'}
                value={form.email} onChange={set('email')} autoComplete="email"/>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-pw">Password</label>
              <div className="input-wrap">
                <input id="auth-pw" type={showPw?'text':'password'} className="form-input"
                  placeholder={tab==='signup'?'Min 8 characters':'Your password'}
                  value={form.password} onChange={set('password')}
                  autoComplete={tab==='signup'?'new-password':'current-password'}/>
                <button type="button" className="input-sfx"
                  aria-label={showPw?'Hide':'Show'} onClick={() => setShowPw(v=>!v)}>
                  <EyeIcon show={showPw}/>
                </button>
              </div>
              {tab === 'signup' && form.password && (
                <>
                  <div className="pw-strength">
                    <div className="pw-bar" style={{width:`${pw.w}%`,background:pw.color}}/>
                  </div>
                  <span className="form-hint" style={{color:pw.color}}>{pw.label}</span>
                </>
              )}
            </div>

            {tab === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-pw2">Confirm password</label>
                <div className="input-wrap">
                  <input id="auth-pw2" type={showPw2?'text':'password'} className="form-input"
                    placeholder="Repeat password" value={form.confirm} onChange={set('confirm')}
                    autoComplete="new-password"/>
                  <button type="button" className="input-sfx"
                    aria-label={showPw2?'Hide':'Show'} onClick={() => setShowPw2(v=>!v)}>
                    <EyeIcon show={showPw2}/>
                  </button>
                </div>
              </div>
            )}

            {tab === 'login' && (
              <button type="button" className="forgot"
                onClick={() => alert('Password reset — coming soon!')}>
                Forgot password?
              </button>
            )}

            {err && <p className="err-msg" role="alert">{err}</p>}

            <button type="submit" className="btn btn-brand btn-md btn-w"
              disabled={loading} style={{opacity:loading?.7:1}}>
              {loading ? '⟳ Connecting...' : tab==='signup' ? '♟ Create Free Account' : '→ Log In'}
            </button>
          </form>

          <p className="auth-foot">
            {tab==='signup'
              ? <>Already have an account? <span onClick={() => onSwitch('login')}>Log in</span></>
              : <>New here? <span onClick={() => onSwitch('signup')}>Create a free account</span></>}
          </p>
        </div>
      </div>
    </div>
  )
}