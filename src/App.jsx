import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import AuthModal from './components/AuthModal'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import AgentsScreen from './screens/AgentsScreen'
import LobbyScreen from './screens/LobbyScreen'
import ProfileScreen from './screens/ProfileScreen'
import * as api from './utils/api'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const DEFAULT_PROFILE = { handle: '', elo: 1200, wins: 0, losses: 0, draws: 0 }

export default function App() {
  const [auth, setAuth] = useState({ open: false, tab: 'signup' })
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  const openAuth  = useCallback((tab = 'signup') => setAuth({ open: true, tab }), [])
  const closeAuth = useCallback(() => setAuth(a => ({ ...a, open: false })), [])

  // ── Boot: restore session + handle SSO callback ──
  useEffect(() => {
    (async () => {
      // 1. SSO callback: token arrives in URL hash or query string
      const params = new URLSearchParams(window.location.search)
      const ssoToken = params.get('token')
      const isNew    = params.get('new') === '1'
      if (ssoToken) {
        // Store token in cookie-aware state — the server already set the cookie,
        // we just need to fetch /me to confirm the session
        window.history.replaceState({}, '', window.location.pathname)
      }

      // 2. Try to restore existing session via /api/auth/me
      try {
        const { user } = await api.auth.me()
        if (user) { setProfile(user); setAuthed(true) }
      } catch {
        // Not logged in — normal
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = useCallback((user) => {
    setProfile(p => ({ ...p, ...user }))
    setAuthed(true)
    closeAuth()
  }, [closeAuth])

  const updateProfile = useCallback((updates) => {
    setProfile(p => ({ ...p, ...updates }))
  }, [])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } catch {}
    setAuthed(false)
    setProfile(DEFAULT_PROFILE)
  }, [])

  const location = useLocation()
  const isGame   = location.pathname.startsWith('/game')

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'var(--bg)'}}>
        <div style={{fontFamily:'var(--fo)',fontSize:'1.5rem',color:'var(--brand)',animation:'pulse-text 1s ease-in-out infinite'}}>
          ♟ Loading...
        </div>
      </div>
    )
  }

  return (
    <AppCtx.Provider value={{ openAuth, closeAuth, login, logout, profile, updateProfile, authed }}>
      {!isGame && <Navbar />}
      <main className={isGame ? 'main-game' : 'main-scroll'}>
        <Routes>
          <Route path="/"        element={<HomeScreen />} />
          <Route path="/game"    element={<GameScreen />} />
          <Route path="/agents"  element={<AgentsScreen />} />
          <Route path="/lobby"   element={<LobbyScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </main>
      {!isGame && <BottomNav />}
      {auth.open && (
        <AuthModal
          tab={auth.tab}
          onClose={closeAuth}
          onSwitch={t => setAuth(a => ({ ...a, tab: t }))}
          onLogin={login}
        />
      )}
    </AppCtx.Provider>
  )
}