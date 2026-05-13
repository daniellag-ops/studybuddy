import { useState, useEffect } from 'react'
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

const BREAK_ACTIVITIES = [
  { emoji: '🧘', text: 'נשימות: שאפו 4 שניות, עצרו 7, נשפו 8', breathing: true },
  { emoji: '🚶', text: 'קומו, התמתחו, ולכו לשתות מים', breathing: false },
  { emoji: '🎵', text: 'שמעו שיר אחד שאתם אוהבים', breathing: false },
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

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  if (h > 0 && m > 0) return `${h} שעות ו-${m} דקות`
  return h > 0 ? `${h} שעות` : `${m} דקות`
}

function fmtTimer(secs: number) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

export default function Dashboard() {
  const [tasks, setTasks]           = useLocalStorage<Task[]>('sb_tasks', [])
  const [schedule]                  = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [lastBreak, setLastBreak]   = useLocalStorage<number>('sb_last_break', 0)
  const [streak, setStreak]         = useLocalStorage<number>('sb_streak', 0)
  const [lastStreakDate, setLastStreakDate] = useLocalStorage<string>('sb_last_streak_date', '')
  const [weeklyScores, setWeeklyScores] = useLocalStorage<{ date: string; score: number }[]>('sb_weekly_scores', [])

  const [activeTimer, setActiveTimer]   = useState<string | null>(null)
  const [timerSecs, setTimerSecs]       = useState(25 * 60)
  const [timerDone, setTimerDone]       = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [nowMs, setNowMs]               = useState(Date.now())
  const [breakActivityIdx]              = useState(() => Math.floor(Math.random() * 3))

  // Clock tick — drives break banner
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Start break clock on first visit
  useEffect(() => {
    if (lastBreak === 0) setLastBreak(Date.now())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pomodoro countdown
  useEffect(() => {
    if (!activeTimer) return
    const id = setInterval(() => {
      setTimerSecs(s => {
        if (s <= 1) { clearInterval(id); setTimerDone(true); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [activeTimer])

  // ── Dates ──
  const today          = new Date()
  const todayDateStr   = fmt(today)
  const todayIdx       = today.getDay()
  const isFriday       = todayIdx === 5

  const tomorrow       = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const tomorrowDateStr = fmt(tomorrow)
  const in3            = new Date(today); in3.setDate(today.getDate() + 3)
  const in5            = new Date(today); in5.setDate(today.getDate() + 5)

  // ── Task buckets ──
  const undone         = tasks.filter(t => !t.done)
  const completedTasks = tasks.filter(t => t.done)
  const allTasksToday  = tasks.filter(t => t.dueDate === todayDateStr)
  const undoneToday    = undone.filter(t => t.dueDate === todayDateStr)
  const allDoneToday   = allTasksToday.length > 0 && allTasksToday.every(t => t.done)
  const tasksTomorrow  = undone.filter(t => t.dueDate === tomorrowDateStr)
  const hardTasks      = undone.filter(t => t.priority === 'דחוף' && t.dueDate && t.dueDate >= todayDateStr && t.dueDate <= fmt(in3))
  const overdueTasks   = undone.filter(t => t.dueDate && t.dueDate < todayDateStr)
  const upcomingTests  = undone.filter(t => t.text.includes('מבחן') && t.dueDate && t.dueDate >= todayDateStr && t.dueDate <= fmt(in5))

  // ── Pressure score ──
  const pressureScore =
    undoneToday.length    * 2 +
    tasksTomorrow.length  * 1 +
    hardTasks.length      * 3 +
    overdueTasks.length   * 4 +
    upcomingTests.length  * 3

  const level  = PRESSURE_LEVELS.find(l => pressureScore <= l.max)!
  const barPct = Math.min((pressureScore / 35) * 100, 100)

  // ── Reasons ──
  const reasons: string[] = []
  if (undoneToday.length > 0) {
    const urg = undoneToday.filter(t => t.priority === 'דחוף')
    reasons.push(`${undoneToday.length} משימות להיום${urg.length > 0 ? `, ${urg.length} מהן דחופות` : ''}`)
  }
  if (tasksTomorrow.length > 0) reasons.push(`${tasksTomorrow.length} משימות למחר`)
  if (overdueTasks.length > 0) reasons.push(overdueTasks.length === 1 ? 'משימה אחת באיחור!' : `${overdueTasks.length} משימות באיחור!`)
  if (upcomingTests.length > 0) reasons.push(upcomingTests.length === 1 ? 'מבחן בקרוב' : `${upcomingTests.length} מבחנים בקרוב`)
  if (reasons.length === 0) reasons.push('אין משימות דחופות! יום רגוע 🌿')

  // ── Estimated time ──
  const totalEstMins    = undoneToday.filter(t => t.estimatedMinutes).reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const estOverloaded   = totalEstMins > 300
  const showReschedule  = totalEstMins > 240
  const reschedulable   = undoneToday.filter(t => t.priority !== 'דחוף')

  // ── Streak tracking ──
  useEffect(() => {
    if (allDoneToday && lastStreakDate !== todayDateStr) {
      const yesterday = fmt(new Date(Date.now() - 86_400_000))
      setStreak(lastStreakDate === yesterday ? streak + 1 : 1)
      setLastStreakDate(todayDateStr)
      setShowCelebration(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDoneToday, todayDateStr])

  // ── Record daily score for weekly summary ──
  useEffect(() => {
    setWeeklyScores(prev => {
      const cutoff = fmt(new Date(Date.now() - 7 * 86_400_000))
      const filtered = prev.filter(d => d.date >= cutoff)
      if (filtered.some(d => d.date === todayDateStr))
        return filtered.map(d => d.date === todayDateStr ? { date: todayDateStr, score: pressureScore } : d)
      return [...filtered, { date: todayDateStr, score: pressureScore }]
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressureScore])

  // ── Break banner ──
  const showBreakBanner = nowMs - lastBreak > 25 * 60 * 1000
  const breakActivity   = BREAK_ACTIVITIES[breakActivityIdx]

  // ── Prioritization helper ──
  const priorityList: (Task & { tag: string; tagColor: string })[] = []
  const seen = new Set<string>()
  const pushPriority = (t: Task, tag: string, tagColor: string) => { if (!seen.has(t.id)) { priorityList.push({ ...t, tag, tagColor }); seen.add(t.id) } }
  overdueTasks.slice(0, 1).forEach(t => pushPriority(t, '⚠️ באיחור!', '#e05555'))
  undoneToday.filter(t => t.priority === 'דחוף').slice(0, 1).forEach(t => pushPriority(t, '🔥 דחוף להיום', '#e05555'))
  undoneToday.filter(t => (t.estimatedMinutes ?? 999) <= 20).slice(0, 1).forEach(t => pushPriority(t, '✨ נצחון מהיר!', '#3aaa6d'))
  undoneToday.filter(t => !seen.has(t.id)).slice(0, 3 - priorityList.length).forEach(t => pushPriority(t, '📌 היום', '#5b9bd5'))

  // ── Weekly summary ──
  const weekStart      = new Date(today); weekStart.setDate(today.getDate() - todayIdx)
  const weekStartStr   = fmt(weekStart)
  const thisWeekScores = weeklyScores.filter(d => d.date >= weekStartStr)
  const avgScore       = thisWeekScores.length > 0 ? Math.round(thisWeekScores.reduce((s, d) => s + d.score, 0) / thisWeekScores.length) : 0
  const weekLevel      = PRESSURE_LEVELS.find(l => avgScore <= l.max) || PRESSURE_LEVELS[0]

  // ── Today's schedule ──
  type ScheduleItem = { kind: 'event'; time: string; ev: ScheduleEvent } | { kind: 'task'; time: string; task: Task }
  const todayItems: ScheduleItem[] = [
    ...(schedule[todayIdx] || []).map(ev => ({ kind: 'event' as const, time: ev.time, ev })),
    ...tasks.filter(t => t.dueDate === todayDateStr).map(t => ({ kind: 'task' as const, time: t.dueTime || '09:00', task: t })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const urgentOpen = undone.filter(t => t.priority === 'דחוף').slice(0, 4)

  const stats = [
    { label: 'משימות פתוחות', value: undone.length,          color: '#5b9bd5' },
    { label: 'הושלמו',         value: completedTasks.length,  color: '#3aaa6d' },
    { label: 'סה״כ משימות',  value: tasks.length,             color: '#4a8ac7' },
    { label: 'רמת עומס',       value: level.label,             color: level.color },
  ]

  // ── Actions ──
  const markDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t))
    if (activeTimer === id) stopTimer()
  }

  const rescheduleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: tomorrowDateStr } : t))

  const startTimer = (id: string) => { setActiveTimer(id); setTimerSecs(25 * 60); setTimerDone(false) }
  const stopTimer  = ()           => { setActiveTimer(null); setTimerSecs(25 * 60); setTimerDone(false) }

  const dismissBreak = () => { setLastBreak(Date.now()); setNowMs(Date.now()) }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '28px', paddingTop: '4px' }}>
        <p style={{ fontSize: '20px', color: '#5b9bd5', fontStyle: 'italic', fontWeight: 700, marginBottom: '4px' }}>ברוכים הבאים!</p>
        <h1 style={{ fontSize: '52px', fontWeight: 900, color: '#5b9bd5', fontStyle: 'italic', letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>StudyBuddy</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '24px' }}>ניהול זמן בלי בלגן!</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="StudyBuddy Logo" className="logo-hero" style={{ maxWidth: '250px', width: '100%', display: 'block' }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: i === 3 ? '15px' : '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-dim)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Break Banner ── */}
      {showBreakBanner && (
        <div style={{ ...card, padding: '16px 20px', marginBottom: '16px', border: '1.5px solid rgba(91,155,213,0.25)', background: 'rgba(91,155,213,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>⏸️ עברו 25 דקות! הגיע זמן להפסקה קצרה</span>
            <button onClick={dismissBreak} style={{ padding: '7px 16px', borderRadius: '12px', border: 'none', background: '#5b9bd5', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              חזרתי! ✅
            </button>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{breakActivity.emoji}</span>
            <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{breakActivity.text}</span>
            {breakActivity.breathing && <div className="breathing-circle" />}
          </div>
        </div>
      )}

      {/* ── Celebration ── */}
      {showCelebration && (
        <div className="celebration-card" style={{ ...card, padding: '24px', marginBottom: '16px', textAlign: 'center', background: 'linear-gradient(135deg,#3aaa6d,#2d9060)', border: 'none' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
          <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>סיימתם הכל להיום! מגיע לכם לנוח 🌟</p>
          {streak > 1 && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>🔥 {streak} ימים ברצף שסיימתם הכל!</p>}
          <button onClick={() => setShowCelebration(false)} style={{ padding: '6px 18px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '13px', cursor: 'pointer' }}>✕ סגור</button>
        </div>
      )}

      {/* ── Streak (passive) ── */}
      {!showCelebration && streak > 1 && (
        <div style={{ ...card, padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🔥</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{streak} ימים ברצף שסיימתם הכל!</span>
        </div>
      )}

      {/* ── Smart Pressure Meter ── */}
      <div style={{ ...card, padding: '22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)' }}>📊 מד עומס חכם</h2>
          <span style={{ fontSize: '15px', fontWeight: 800, color: level.color, background: `${level.color}18`, borderRadius: '12px', padding: '4px 12px' }}>
            {level.label}
          </span>
        </div>
        <div style={{ direction: 'ltr', width: '100%', height: '12px', borderRadius: '6px', background: 'rgba(91,155,213,0.1)', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', borderRadius: '6px', width: `${barPct}%`, background: 'linear-gradient(90deg, #3aaa6d, #d4960a, #e05555)', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-dim)' }}>
              <span style={{ color: level.color, fontSize: '11px' }}>●</span>{r}
            </div>
          ))}
          {totalEstMins > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: estOverloaded ? '#e05555' : 'var(--text-dim)' }}>
              <span style={{ color: estOverloaded ? '#e05555' : '#5b9bd5', fontSize: '11px' }}>●</span>
              זמן עבודה משוער להיום: {fmtMins(totalEstMins)}{estOverloaded ? ' — יום עמוס, שקלו לדחות' : ''}
            </div>
          )}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '12px', background: `${level.color}12`, border: `1px solid ${level.color}28`, fontSize: '13px', fontWeight: 600, color: level.color }}>
          💡 טיפ: {level.tip}
        </div>
      </div>

      {/* ── Active Pomodoro Timer ── */}
      {activeTimer && (
        <div style={{ ...card, padding: '16px 20px', marginBottom: '16px', border: `2px solid ${timerDone ? '#3aaa6d' : '#5b9bd5'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '30px', fontWeight: 900, color: timerDone ? '#3aaa6d' : '#5b9bd5', fontVariantNumeric: 'tabular-nums', minWidth: '64px' }}>
              {timerDone ? '✅' : fmtTimer(timerSecs)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{timerDone ? 'פומודורו הסתיים!' : '⏱️ פומודורו רץ...'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tasks.find(t => t.id === activeTimer)?.text}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {timerDone && (
                <button onClick={() => markDone(activeTimer)} style={{ padding: '7px 14px', borderRadius: '12px', border: 'none', background: '#3aaa6d', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  סיים ✓
                </button>
              )}
              <button onClick={stopTimer} style={{ padding: '7px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', fontSize: '13px', cursor: 'pointer' }}>
                עצור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prioritization Helper (score ≥ 13) ── */}
      {pressureScore >= 13 && priorityList.length > 0 && !allDoneToday && (
        <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)', marginBottom: '14px' }}>📋 סדר מומלץ להיום:</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {priorityList.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '14px',
                  background: activeTimer === task.id ? 'rgba(91,155,213,0.1)' : 'var(--surface-2)',
                  border: `1px solid ${activeTimer === task.id ? '#5b9bd5' : 'var(--border-light)'}`,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontWeight: 900, color: 'var(--text-dim)', fontSize: '14px', flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.text}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: `${task.tagColor}18`, color: task.tagColor, fontWeight: 700 }}>{task.tag}</span>
                    {task.estimatedMinutes && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>⏱️ {fmtMins(task.estimatedMinutes)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {activeTimer !== task.id
                    ? <button onClick={() => startTimer(task.id)} style={{ padding: '5px 11px', borderRadius: '10px', border: 'none', background: '#5b9bd5', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>▶ התחל</button>
                    : <span style={{ fontSize: '12px', fontWeight: 700, color: '#5b9bd5', padding: '5px 0' }}>רץ ▶</span>
                  }
                  <button onClick={() => markDone(task.id)} style={{ padding: '5px 11px', borderRadius: '10px', border: '1px solid #3aaa6d', background: 'transparent', color: '#3aaa6d', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Smart Reschedule (>4h estimated) ── */}
      {showReschedule && reschedulable.length > 0 && (
        <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, fontStyle: 'italic', color: '#d4960a', marginBottom: '4px' }}>😅 היום עמוס! אולי כדאי לדחות משהו?</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            זמן משוער להיום: {fmtMins(totalEstMins)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {reschedulable.slice(0, 4).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '12px', background: 'rgba(212,150,10,0.07)', border: '1px solid rgba(212,150,10,0.18)' }}>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</span>
                {task.estimatedMinutes && (
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', flexShrink: 0 }}>⏱️ {fmtMins(task.estimatedMinutes)}</span>
                )}
                <button
                  onClick={() => rescheduleTask(task.id)}
                  style={{ padding: '4px 12px', borderRadius: '10px', border: 'none', background: '#d4960a', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  דחה למחר ←
                </button>
              </div>
            ))}
          </div>
          {totalEstMins <= 240 && (
            <p style={{ fontSize: '13px', color: '#3aaa6d', marginTop: '10px', fontWeight: 600 }}>
              עכשיו נשארו לכם {fmtMins(totalEstMins)} — הרבה יותר סביר! 👍
            </p>
          )}
        </div>
      )}

      {/* ── Weekly Summary (Fridays) ── */}
      {isFriday && thisWeekScores.length > 0 && (
        <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, fontStyle: 'italic', color: 'var(--text)', marginBottom: '14px' }}>📊 סיכום שבועי</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'משימות שהושלמו', value: completedTasks.length, color: '#3aaa6d' },
              { label: 'עומס ממוצע', value: weekLevel.label, color: weekLevel.color },
              { label: 'ימי רצף', value: `🔥 ${streak}`, color: '#e07a1a' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: '14px', background: 'rgba(91,155,213,0.07)' }}>
                <div style={{ fontSize: i === 0 ? '22px' : '15px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: weekLevel.color }}>
            {avgScore <= 5  ? 'שבוע מעולה! שמרתם על איזון מדהים 🌟' :
             avgScore <= 12 ? 'שבוע טוב! עשיתם עבודה יפה 👍' :
             avgScore <= 20 ? 'שבוע עמוס — אבל התמדתם! 💪' :
             'שבוע קשה — מגיע לכם מנוחה טובה בסוף שבוע 🤗'}
          </p>
        </div>
      )}

      {/* ── Bottom row ── */}
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
