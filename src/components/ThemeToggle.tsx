import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      style={{
        position: 'fixed',
        top: '14px',
        left: '16px',
        zIndex: 200,
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1.5px solid var(--border)',
        background: 'var(--surface)',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px var(--shadow)',
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
