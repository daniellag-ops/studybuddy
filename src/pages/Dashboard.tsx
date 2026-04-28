import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, ScheduleData, ScheduleEvent } from '../types'

const STRESS_LEVELS = [
  { label: '😌 רגוע', value: 1, color: '#3aaa6d', advice: 'מעולה! אתם במצב מצוין. המשיכו לשמור על שגרה מאוזנת ותשמרו על האנרגיה הזו.' },
  { label: '🙂 בסדר', value: 2, color: '#228b78', advice: 'אתם על המסלול הנכון! קצת הפסקה ומשקאות יכולים לעזור לשמור על הרמה הזו.' },
  { label: '😐 לחוץ קצת', value: 3, color: '#d4960a', advice: 'נסו לעשות הפסקה קצרה. טכניקת הפומודורו יכולה לעזור לנהל את הזמן טוב יותר.' },
  { label: '😰 לחוץ', value: 4, color: '#e07a1a', advice: 'אנחנו מבינים. נסו נשימה עמוקה (4-7-8), תפרקו משימות גדולות לקטנות, ואל תשכחו לישון.' },
  { label: '🤯 על הקצה', value: 5, color: '#e05555', advice: 'עצרו רגע. שוחחו עם מישהו שאתם סומכים עליו, צאו להליכה קצרה, ותזכרו: זה זמני.' },
]

const card: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'white',
  borderRadius: '18px',
  border: '1px solid rgba(34,139,120,0.08)',
  boxShadow: '0 2px 12px rgba(34,139,120,0.08)',
}

export default function Dashboard() {
  const [tasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [schedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [stress, setStress] = useLocalStorage<number>('sb_stress', 1)

  const openTasks = tasks.filter(t => !t.done)
  const completedTasks = tasks.filter(t => t.done)
  const urgentOpen = openTasks.filter(t => t.priority === 'דחוף').slice(0, 4)

  const todayIdx = new Date().getDay()
  const todayEvents: ScheduleEvent[] = [...(schedule[todayIdx] || [])].sort((a, b) =>
    a.time.localeCompare(b.time)
  )

  const currentStress = STRESS_LEVELS.find(s => s.value === stress) || STRESS_LEVELS[0]

  const stats = [
    { label: 'משימות פתוחות', value: openTasks.length, color: '#3581b8' },
    { label: 'הושלמו', value: completedTasks.length, color: '#3aaa6d' },
    { label: 'סה״כ משימות', value: tasks.length, color: '#228b78' },
    { label: 'רמת לחץ', value: currentStress.label, color: currentStress.color },
  ]

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      {/* Welcome heading */}
      <h1
        style={{ color: '#2a3b33', textAlign: 'center', width: '100%', fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}
      >
        היי! ברוכים הבאים ל-StudyBuddy 🌿
      </h1>

      {/* Stats row — 4 equal columns */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%', marginBottom: '16px' }}
      >
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', marginTop: '4px', color: '#5a8a78' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stress Meter — full width */}
      <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2a3b33', marginBottom: '16px' }}>מד לחץ</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {STRESS_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => setStress(level.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: stress === level.value ? level.color : 'rgba(34,139,120,0.06)',
                color: stress === level.value ? 'white' : '#2a3b33',
                border: stress === level.value ? 'none' : '1px solid rgba(34,139,120,0.15)',
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
        <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: '#e8f3f0', overflow: 'hidden', marginBottom: '12px' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '6px',
              width: `${(stress / 5) * 100}%`,
              background: 'linear-gradient(90deg, #3aaa6d, #d4960a, #e05555)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p style={{ fontSize: '14px', fontWeight: 500, color: currentStress.color }}>{currentStress.advice}</p>
      </div>

      {/* Bottom row — 2 equal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
        {/* Urgent tasks */}
        <div style={{ ...card, padding: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2a3b33', marginBottom: '16px' }}>🔥 משימות דחופות</h2>
          {urgentOpen.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#5a8a78' }}>אין משימות דחופות פתוחות ✓</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentOpen.map(task => (
                <li
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: 'rgba(224,85,85,0.06)',
                    borderRight: '3px solid #e05555',
                  }}
                >
                  <span style={{ flex: 1 }}>{task.text}</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, background: '#e05555', color: 'white' }}>
                    דחוף
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's schedule */}
        <div style={{ ...card, padding: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2a3b33', marginBottom: '16px' }}>📅 לוח היום</h2>
          {todayEvents.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#5a8a78' }}>אין אירועים היום</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayEvents.map((ev, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    background: 'rgba(34,139,120,0.05)',
                    borderRight: `3px solid ${ev.categoryColor}`,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#5a8a78', flexShrink: 0 }}>{ev.time}</span>
                  <span>{ev.categoryEmoji} {ev.activity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
