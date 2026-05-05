import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'ראשי', icon: '🏠' },
  { to: '/tasks', label: 'משימות', icon: '✅' },
  { to: '/schedule', label: 'לו״ז', icon: '📅' },
  { to: '/tips', label: 'טיפים', icon: '💡' },
]

interface Props {
  chatOpen: boolean
  onChatToggle: () => void
}

export default function BottomNav({ chatOpen, onChatToggle }: Props) {
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
        <button
          className={`tab-btn${chatOpen ? ' active' : ''}`}
          onClick={onChatToggle}
        >
          <div className="tab-icon">💬</div>
          <span className="tab-label">צ׳אט</span>
        </button>
      </div>
    </nav>
  )
}
