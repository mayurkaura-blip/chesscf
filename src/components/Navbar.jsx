import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../App'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { openAuth, authed, profile, logout } = useApp()
  const location = useLocation()
  const nav = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const close = () => setOpen(false)
  const isActive = (p) => location.pathname === p ? 'nav-link active' : 'nav-link'

  return (
    <header className={`navbar${scrolled?' scrolled':''}`} role="banner">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close} aria-label="ChessCF home">
          <span className="brand-icon" aria-hidden="true">♟</span>
          <span className="brand-name">Chess<span>CF</span></span>
          <span className="brand-tag">BETA</span>
        </Link>

        <nav className={`nav-links${open?' open':''}`} aria-label="Main navigation">
          <Link to="/" className={isActive('/')} onClick={close}>Home</Link>
          <Link to="/agents" className={isActive('/agents')} onClick={close}>AI Agents</Link>
          <Link to="/lobby" className={isActive('/lobby')} onClick={close}>Play Online</Link>
          <Link to="/profile" className={isActive('/profile')} onClick={close}>Profile</Link>
        </nav>

        <div className="navbar-actions">
          {authed ? (
            <>
              <span style={{ fontFamily:'var(--fm)', fontSize:'.78rem', color:'var(--text-2)' }}>
                @{profile.handle}
              </span>
              <button className="btn btn-ghost btn-md" onClick={() => { logout(); close(); }}>Log Out</button>
              <button className="btn btn-brand btn-md" onClick={() => { nav('/game'); close(); }}>
                ♟ Play Now
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-md" onClick={() => { openAuth('login'); close(); }}>Log In</button>
              <button className="btn btn-brand btn-md" onClick={() => { openAuth('signup'); close(); }}>
                Play Free ♟
              </button>
            </>
          )}
          <button className="hamburger" aria-label="Toggle menu" aria-expanded={open}
            onClick={() => setOpen(v => !v)}>
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </header>
  )
}