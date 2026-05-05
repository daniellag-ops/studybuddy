import React, { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ScheduleData, ScheduleEvent, Task, Priority } from '../types'

const PRIORITY_COLORS: Record<Priority, string> = {
  'דחוף': '#e05555',
  'בינוני': '#d4960a',
  'רגיל': '#3aaa6d',
}

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const DAY_NAMES_LONG = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
const DAY_NAMES_SHORT = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const CATEGORIES = [
  { label: 'לימודים', emoji: '📖', color: '#3581b8' },
  { label: 'חברים', emoji: '👫', color: '#c44daa' },
  { label: 'תחביב', emoji: '🎨', color: '#5b9bd5' },
  { label: 'מנוחה', emoji: '😴', color: '#d4960a' },
  { label: 'ספורט', emoji: '⚽', color: '#3aaa6d' },
]

const BORDER = 'rgba(197,217,237,0.85)'

type View = 'month' | 'week'

interface ModalState { dayIdx: number; hour: string }

function getWeekDates(weekOffset: number) {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

export default function Schedule() {
  const [schedule, setSchedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [view, setView] = useState<View>('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].label)

  const today = new Date()

  // ── helpers ──────────────────────────────────────────────────────────
  const dateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const isToday = (d: Date) => dateStr(d) === dateStr(today)

  // Month helpers
  const getMonthInfo = (offset: number) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      name: HEBREW_MONTHS[d.getMonth()],
      firstDayOfWeek: d.getDay(),
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    }
  }

  const buildMonthGrid = (info: ReturnType<typeof getMonthInfo>): (Date | null)[] => {
    const cells: (Date | null)[] = []
    for (let i = 0; i < info.firstDayOfWeek; i++) cells.push(null)
    for (let d = 1; d <= info.daysInMonth; d++) cells.push(new Date(info.year, info.month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const getDots = (date: Date): string[] => {
    const dots: string[] = []
    const evs = schedule[date.getDay()] || []
    evs.slice(0, 2).forEach(ev => dots.push(ev.categoryColor))
    tasks.filter(t => t.dueDate === dateStr(date)).slice(0, 1).forEach(t => dots.push(PRIORITY_COLORS[t.priority]))
    return dots.slice(0, 3)
  }

  const getWeekOffsetForDate = (date: Date): number => {
    const todaySunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const dateSunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
    return Math.round((dateSunday.getTime() - todaySunday.getTime()) / (7 * 24 * 60 * 60 * 1000))
  }

  const handleDayClick = (date: Date) => {
    setWeekOffset(getWeekOffsetForDate(date))
    setView('week')
  }

  const handleBackToMonth = () => {
    const dates = getWeekDates(weekOffset)
    const mid = dates[3]
    setMonthOffset((mid.getFullYear() - today.getFullYear()) * 12 + (mid.getMonth() - today.getMonth()))
    setView('month')
  }

  // Week helpers
  const weekDates = getWeekDates(weekOffset)

  const getCellEvents = (dayIdx: number, hour: string): ScheduleEvent[] =>
    (schedule[dayIdx] || []).filter(e => e.time === hour)

  const getCellTasks = (date: Date, hour: string): Task[] =>
    tasks.filter(t => {
      if (!t.dueDate || t.dueDate !== dateStr(date)) return false
      return (t.dueTime || '09:00').slice(0, 2) + ':00' === hour
    })

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const addEvent = () => {
    if (!modal || !newActivity.trim()) return
    const cat = CATEGORIES.find(c => c.label === newCategory)!
    setSchedule(prev => ({
      ...prev,
      [modal.dayIdx]: [...(prev[modal.dayIdx] || []), {
        uid: crypto.randomUUID(),
        time: modal.hour,
        category: cat.label,
        categoryEmoji: cat.emoji,
        categoryColor: cat.color,
        activity: newActivity.trim(),
      }],
    }))
    setModal(null)
    setNewActivity('')
    setNewCategory(CATEGORIES[0].label)
  }

  const deleteEvent = (dayIdx: number, uid: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayIdx]: (prev[dayIdx] || []).filter(e => e.uid !== uid),
    }))
  }

  // ── shared styles ─────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    border: `1.5px solid ${BORDER}`,
    boxShadow: '0 4px 20px rgba(91,155,213,0.1)',
  }

  const navBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
    background: 'rgba(91,155,213,0.1)',
    color: '#5b9bd5',
    border: 'none',
    cursor: 'pointer',
  }

  // ── month info ────────────────────────────────────────────────────────
  const monthInfo = getMonthInfo(monthOffset)
  const monthGrid = buildMonthGrid(monthInfo)

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* ═══════════ MONTH VIEW ═══════════ */}
      {view === 'month' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a' }}>
              📅 לוח שבועי
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button style={navBtnStyle} onClick={() => setMonthOffset(m => m - 1)}>›</button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#2a3a4a', minWidth: 110, textAlign: 'center' }}>
                {monthInfo.name} {monthInfo.year}
              </span>
              <button style={navBtnStyle} onClick={() => setMonthOffset(m => m + 1)}>‹</button>
              <button
                onClick={() => setMonthOffset(0)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: monthOffset === 0 ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'rgba(91,155,213,0.1)',
                  color: monthOffset === 0 ? 'white' : '#5b9bd5',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: monthOffset === 0 ? '0 3px 10px rgba(91,155,213,0.3)' : 'none',
                }}
              >
                היום
              </button>
            </div>
          </div>

          {/* Calendar card */}
          <div style={cardStyle}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {DAY_NAMES_SHORT.map(name => (
                <div
                  key={name}
                  style={{
                    padding: '10px 4px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#5b9bd5',
                    borderBottom: `1px solid ${BORDER}`,
                    borderInlineEnd: `1px solid ${BORDER}`,
                    background: 'rgba(91,155,213,0.04)',
                  }}
                >
                  {name}
                </div>
              ))}

              {/* Day cells */}
              {monthGrid.map((date, i) => {
                const dots = date ? getDots(date) : []
                const isCurrentDay = date ? isToday(date) : false
                return (
                  <div
                    key={i}
                    className={date ? 'month-cell' : ''}
                    onClick={() => date && handleDayClick(date)}
                    style={{
                      minHeight: '72px',
                      padding: '6px 4px',
                      borderBottom: `1px solid ${BORDER}`,
                      borderInlineEnd: `1px solid ${BORDER}`,
                      background: !date ? 'rgba(0,0,0,0.02)' : 'white',
                      cursor: date ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {date && (
                      <>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: isCurrentDay ? 700 : 500,
                            background: isCurrentDay ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'transparent',
                            color: isCurrentDay ? 'white' : '#2a3a4a',
                            boxShadow: isCurrentDay ? '0 2px 8px rgba(91,155,213,0.4)' : 'none',
                            flexShrink: 0,
                          }}
                        >
                          {date.getDate()}
                        </div>
                        {dots.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {dots.map((color, j) => (
                              <div
                                key={j}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ WEEK VIEW ═══════════ */}
      {view === 'week' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleBackToMonth}
                style={{
                  padding: '7px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(91,155,213,0.1)',
                  color: '#5b9bd5',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ← חזרה לחודש
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a' }}>
                לוח שבועי
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setWeekOffset(0)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: weekOffset === 0 ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'rgba(91,155,213,0.1)',
                  color: weekOffset === 0 ? 'white' : '#5b9bd5',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: weekOffset === 0 ? '0 3px 10px rgba(91,155,213,0.3)' : 'none',
                }}
              >
                היום
              </button>
              <button style={navBtnStyle} onClick={() => setWeekOffset(w => w - 1)}>›</button>
              <button style={navBtnStyle} onClick={() => setWeekOffset(w => w + 1)}>‹</button>
            </div>
          </div>

          {/* Grid */}
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))', minWidth: '700px' }}>
              {/* Header row */}
              <div style={{ borderBottom: `1px solid ${BORDER}`, borderInlineEnd: `1px solid ${BORDER}` }} />
              {weekDates.map((date, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    borderInlineEnd: `1px solid ${BORDER}`,
                    padding: '8px 4px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6a8a9a' }}>{DAY_NAMES_LONG[i]}</div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      margin: '2px auto 0',
                      background: isToday(date) ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'transparent',
                      color: isToday(date) ? 'white' : '#2a3a4a',
                      boxShadow: isToday(date) ? '0 3px 10px rgba(91,155,213,0.4)' : 'none',
                    }}
                  >
                    {date.getDate()}
                  </div>
                </div>
              ))}

              {/* Hour rows */}
              {HOURS.map(hour => (
                <React.Fragment key={hour}>
                  <div
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      borderInlineEnd: `1px solid ${BORDER}`,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6a8a9a',
                      minHeight: '56px',
                      textAlign: 'center',
                      paddingTop: '6px',
                    }}
                  >
                    {hour}
                  </div>
                  {weekDates.map((date, dayIdx) => {
                    const events = getCellEvents(dayIdx, hour)
                    const cellTasks = getCellTasks(date, hour)
                    return (
                      <div
                        key={dayIdx}
                        className="schedule-cell cursor-pointer"
                        style={{
                          borderBottom: `1px solid ${BORDER}`,
                          borderInlineEnd: `1px solid ${BORDER}`,
                          minHeight: '56px',
                          padding: '3px',
                        }}
                        onClick={() => setModal({ dayIdx, hour })}
                      >
                        {events.map(ev => (
                          <div
                            key={ev.uid}
                            className="rounded-lg px-1.5 py-0.5 mb-0.5 flex items-center gap-1 text-xs"
                            style={{ background: `${ev.categoryColor}18`, borderRight: `3px solid ${ev.categoryColor}`, color: '#2a3a4a' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <span>{ev.categoryEmoji}</span>
                            <span className="flex-1 truncate">{ev.activity}</span>
                            <button
                              onClick={e => { e.stopPropagation(); deleteEvent(dayIdx, ev.uid) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05555', fontSize: '11px', opacity: 0.6 }}
                            >✕</button>
                          </div>
                        ))}
                        {cellTasks.map(task => (
                          <div
                            key={task.id}
                            className="rounded-lg px-1.5 py-0.5 mb-0.5 flex items-center gap-1 text-xs"
                            style={{
                              background: 'rgba(91,155,213,0.08)',
                              borderRight: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                              color: '#2a3a4a',
                              opacity: task.done ? 0.5 : 1,
                              cursor: 'pointer',
                              textDecoration: task.done ? 'line-through' : 'none',
                            }}
                            onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                          >
                            <span>✅</span>
                            <span className="flex-1 truncate">{task.text}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ ADD EVENT MODAL ═══════════ */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(42,58,74,0.4)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '24px', padding: '28px',
              maxWidth: '420px', width: '90%', boxSizing: 'border-box',
              boxShadow: '0 20px 60px rgba(91,155,213,0.25)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, fontStyle: 'italic', color: '#2a3a4a', marginBottom: '4px' }}>
              הוספת אירוע
            </h3>
            <p style={{ fontSize: '13px', color: '#6a8a9a', marginBottom: '20px' }}>
              {DAY_NAMES_LONG[modal.dayIdx]} בשעה {modal.hour}
            </p>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: '14px', fontSize: '14px', outline: 'none', marginBottom: '12px', border: `1.5px solid rgba(91,155,213,0.25)`, background: '#f0f6fd', color: '#2a3a4a', boxSizing: 'border-box' }}
            >
              {CATEGORIES.map(cat => <option key={cat.label} value={cat.label}>{cat.emoji} {cat.label}</option>)}
            </select>
            <input
              type="text"
              value={newActivity}
              onChange={e => setNewActivity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()}
              placeholder="מה תעשו?"
              autoFocus
              style={{ width: '100%', padding: '10px 16px', borderRadius: '14px', fontSize: '14px', outline: 'none', marginBottom: '20px', border: `1.5px solid rgba(91,155,213,0.25)`, background: '#f0f6fd', color: '#2a3a4a', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addEvent}
                style={{ flex: 1, padding: '12px 0', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)', boxShadow: '0 4px 14px rgba(91,155,213,0.35)', boxSizing: 'border-box' }}
              >הוסף</button>
              <button
                onClick={() => setModal(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: '14px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(91,155,213,0.08)', color: '#5b9bd5', boxSizing: 'border-box' }}
              >ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
