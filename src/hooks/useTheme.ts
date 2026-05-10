import { useState, useEffect } from 'react'

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('sb_theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark')
    try { localStorage.setItem('sb_theme', theme) } catch { /* ignore */ }
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle }
}
