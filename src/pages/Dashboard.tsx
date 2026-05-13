import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, ScheduleData, ScheduleEvent, Priority } from '../types'

const PRIORITY_COLORS: Record<Priority, string> = {
  'דחוף': '#e05555',
  'בינוני': '#d4960a',
  'רגיל': '#3aaa6d',
}

const PRESSURE_LEVELS = [
  { max: 5,        label: '😌 רגוע',     color: '#3aaa6d', tip: 'יום מעולה להתקדם עם פרויקטים או לקרוא לכיף' },
  { max: 12,       label: '🙂 בסדר',      color: '#228b78', tip: 'קחו הפסקה של 5 דקות כל 25 דקות' },
  { max: 20,       label: '😐 עמוס קצת', color: '#d4960a', tip: 'קחו הפסקה של 5 דקות כל 25 דקות' },
  { max: 30,       label: '😰 עמוס',      color: '#e07a1a', tip: 'התחילו מהמשימה הכי קשה כשהאנרגיה גבוהה' },
  { max: Infinity, label: '🤯 על הקצה',  color: '#e05555', tip: 'התחילו מהמשימה הכי קשה כשהאנרגיה גבוהה' },
]

const card: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--surface)',
  borderRadius: '24px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 18px var(--shadow)',
  transition: 'background-color 0.3s ease',
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const [tasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [schedule] = useLocalStorage<ScheduleData>('sb_schedule', {})

  // ── Date strings ──
  const today = new Date()
  const todayDateStr = fmt(today)
  const todayIdx = today.getDay()

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowDateStr = fmt(tomorrow)

  const in3 = new Date(today); in3.setDate(today.getDate() + 3)
  const in3Str = fmt(in3)
  const in5 = new Date(today); in5.setDate(today.getDate() + 5)
  const in5Str = fmt(in5)

  // ── Task buckets ──
  const undone = tasks.filter(t => !t.done)
  const openTasks = undone
  const completedTasks = tasks.filter(t => t.done)

  const tasksToday     = undone.filter(t => t.dueDate === todayDateStr)
  const tasksTomorrow  = undone.filter(t => t.dueDate === tomorrowDateStr)
  const hardTasks      = undone.filter(t => t.priority === 'דחוף' && t.dueDate && t.dueDate >= todayDateStr && t.dueDate <= in3Str)
  const overdueTasks   = undone.filter(t => t.dueDate && t.dueDate < todayDateStr)
  const upcomingTests  = undone.filter(t => t.text.includes('מבחן') && t.dueDate && t.dueDate >= todayDateStr && t.dueDate <= in5Str)

  // ── Pressure score ──
  const pressureScore =
    tasksToday.length   * 2 +
    tasksTomorrow.length * 1 +
    hardTasks.length    * 3 +
    overdueTasks.length * 4 +
    upcomingTests.length * 3

  const level = PRESSURE_LEVELS.find(l => pressureScore <= l.max)!
  const barPct = Math.min((pressureScore / 35) * 100, 100)

  // ── WHY reasons ──
  const reasons: string[] = []
  if (tasksToday.length > 0) {
    const urgentToday = tasksToday.filter(t => t.priority === 'דחוף')
    reasons.push(`${tasksToday.length} משימות להיום${urgentToday.length > 0 ? `, ${urgentToday.length} מהן דחופות` : ''}`)
  }
  if (tasksTomorrow.length > 0) reasons.push(`${tasksTomorrow.length} משימות למחר`)
  if (overdueTasks.length > 0) reasons.push(overdueTasks.length === 1 ? 'משימה אחת באיחור!' : `${overdueTasks.length} משימות באיחור!`)
  if (upcomingTests.length > 0) reasons.push(upcomingTests.length === 1 ? 'מבחן בקרוב' : `${upcomingTests.length} מבחנים בקרוב`)
  if (reasons.length === 0) reasons.push('אין משימות דחופות! יום רגוע 🌿')

  // ── Estimated time ──
  const todayUndoneWithEst = tasksToday.filter(t => t.estimatedMinutes)
  const totalEstMins = todayUndoneWithEst.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const estH = Math.floor(totalEstMins / 60)
  const estM = totalEstMins % 60
  const estText = estH > 0 && estM > 0 ? `${estH} שעות ו-${estM} דקות`
    : estH > 0 ? `${estH} שעות` : `${estM} דקות`
  const estOverloaded = totalEstMins > 300

  // ── Today's schedule ──
  type ScheduleItem =
    | { kind: 'event'; time: string; ev: ScheduleEvent }
    | { kind: 'task'; time: string; task: Task }

  const todayItems: ScheduleItem[] = [
    ...(schedule[todayIdx] || []).map(ev => ({ kind: 'event' as const, time: ev.time, ev })),
    ...tasks.filter(t => t.dueDate === todayDateStr).map(t => ({ kind: 'task' as const, time: t.dueTime || '09:00', task: t })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const urgentOpen = openTasks.filter(t => t.priority === 'דחוף').slice(0, 4)

  const stats = [
    { label: 'משימות פתוחות', value: openTasks.length,    color: '#5b9bd5' },
    { label: 'הושלמו',        value: completedTasks.length, color: '#3aaa6d' },
    { label: 'סה״כ משימות',  value: tasks.length,          color: '#4a8ac7' },
    { label: 'רמת עומס',      value: level.label,           color: level.color },
  ]

  return (
    <div
      className="fade-in"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '28px', paddingTop: '4px' }}>
        <p style={{ fontSize: '20px', color: '#5b9bd5', fontStyle: 'italic', fontWeight: 700, marginBottom: '4px' }}>
          ברוכים הבאים!
        </p>
        <h1 style={{ fontSize: '52px', fontWeight: 900, color: '#5b9bd5', fontStyle: 'italic', letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>
          StudyBuddy
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '24px' }}>
          ניהול זמן בלי בלגן!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="StudyBuddy Logo" className="logo-hero" style={{ maxWidth: '250px', width: '100%', display: 'block' }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: i === 3 ? '16px' : '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-dim)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Smart Pressure Meter */}
      <div style={{ ...card, padding: '22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)' }}>📊 מד עומס חכם</h2>
          <span style={{
            fontSize: '15px', fontWeight: 800, color: level.color,
            background: `${level.color}18`, borderRadius: '12px', padding: '4px 12px',
          }}>
            {level.label}
          </span>
        </div>

        {/* Bar */}
        <div style={{ direction: 'ltr', width: '100%', height: '12px', borderRadius: '6px', background: 'rgba(91,155,213,0.1)', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{
            height: '100%', borderRadius: '6px',
            width: `${barPct}%`,
            background: 'linear-gradient(90deg, #3aaa6d, #d4960a, #e05555)',
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Reasons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-dim)' }}>
              <span style={{ color: level.color, fontSize: '11px' }}>●</span>
              {r}
            </div>
          ))}
          {totalEstMins > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: estOverloaded ? '#e05555' : 'var(--text-dim)' }}>
              <span style={{ color: estOverloaded ? '#e05555' : '#5b9bd5', fontSize: '11px' }}>●</span>
              זמן עבודה משוער להיום: {estText}{estOverloaded ? ' — יום עמוס, שקלו לדחות' : ''}
            </div>
          )}
        </div>

        {/* Smart tip */}
        <div style={{
          padding: '10px 14px', borderRadius: '12px',
          background: `${level.color}12`,
          border: `1px solid ${level.color}28`,
          fontSize: '13px', fontWeight: 600, color: level.color,
        }}>
          💡 טיפ: {level.tip}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
        {/* Urgent tasks */}
        <div style={{ ...card, padding: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)', marginBottom: '16px' }}>🔥 משימות דחופות</h2>
          {urgentOpen.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>אין משימות דחופות פתוחות ✓</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentOpen.map(task => (
                <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '14px', fontSize: '14px', background: 'rgba(224,85,85,0.06)', borderRight: '3px solid #e05555' }}>
                  <span style={{ flex: 1 }}>{task.text}</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, background: '#e05555', color: 'white' }}>דחוף</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's schedule */}
        <div style={{ ...card, padding: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)', marginBottom: '16px' }}>📅 לוח היום</h2>
          {todayItems.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>אין אירועים היום</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayItems.map((item, i) => item.kind === 'event' ? (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '14px', fontSize: '14px', background: 'rgba(91,155,213,0.05)', borderRight: `3px solid ${item.ev.categoryColor}` }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-dim)', flexShrink: 0 }}>{item.time}</span>
                  <span>{item.ev.categoryEmoji} {item.ev.activity}</span>
                </li>
              ) : (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '14px', fontSize: '14px', background: 'rgba(91,155,213,0.04)', borderRight: `3px solid ${PRIORITY_COLORS[item.task.priority]}`, opacity: item.task.done ? 0.55 : 1, textDecoration: item.task.done ? 'line-through' : 'none' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-dim)', flexShrink: 0 }}>{item.time}</span>
                  <span>✅ {item.task.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
