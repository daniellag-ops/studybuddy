import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'ראשי', icon: '🏠' },
  { to: '/tasks', label: 'משימות', icon: '✅' },
  { to: '/schedule', label: 'לו״ז', icon: '📅' },
  { to: '/study', label: 'למידה', icon: '📚' },
  { to: '/tips', label: 'טיפים', icon: '💡' },
  { to: '/about', label: 'אנחנו', icon: '👥' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
          >
            <div className="tab-icon">{icon}</div>
            <span className="tab-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
