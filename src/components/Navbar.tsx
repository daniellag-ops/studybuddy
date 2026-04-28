import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'ראשי' },
  { to: '/tasks', label: 'משימות' },
  { to: '/schedule', label: 'לו״ז' },
  { to: '/tips', label: 'טיפים' },
]

export default function Navbar() {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        zIndex: 50,
        background: 'rgba(238,246,243,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(34,139,120,0.12)',
        boxSizing: 'border-box',
      }}
    >
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="nav-logo">StudyBuddy</span>
          <span>🌿</span>
        </div>
        <div className="nav-links">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
