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
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#228b78' }}>StudyBuddy</span>
          <span style={{ fontSize: '20px' }}>🌿</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: isActive ? 'linear-gradient(135deg, #228b78, #2ba08a)' : 'transparent',
                color: isActive ? 'white' : '#5a8a78',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
