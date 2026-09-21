import { Link, useLocation } from 'react-router-dom'
const TABS = [
  { to:'/', icon:'🏠', label:'Home' },
  { to:'/agents', icon:'🤖', label:'Agents' },
  { to:'/lobby', icon:'🌐', label:'Online' },
  { to:'/profile', icon:'👤', label:'Profile' },
]
export default function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {TABS.map(t => (
        <Link key={t.to} to={t.to} className={`bot-item${pathname===t.to?' active':''}`}>
          <span className="bot-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  )
}