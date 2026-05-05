import React, { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ScheduleData, ScheduleEvent, Task, Priority } from '../types'

const PRIORITY_COLORS: Record<Priority, string> = {
  'דחוף': '#e05555',
  'בינוני': '#d4960a',
  'רגיל': '#3aaa6d',
}

const DAY_NAMES = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const CATEGORIES = [
  { label: 'לימודים', emoji: '📖', color: '#3581b8' },
  { label: 'חברים', emoji: '👫', color: '#c44daa' },
  { label: 'תחביב', emoji: '🎨', color: '#5b9bd5' },
  { label: 'מנוחה', emoji: '😴', color: '#d4960a' },
  { label: 'ספורט', emoji: '⚽', color: '#3aaa6d' },
]

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

interface ModalState { dayIdx: number; hour: string }

export default function Schedule() {
  const [schedule, setSchedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].label)

  const today = new Date()
  const weekDates = getWeekDates(weekOffset)

  const dateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const isToday = (d: Date) => dateStr(d) === dateStr(today)

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

  const deleteEvent = (dayIdx: number, uid: string) =>
    setSchedule(prev => ({
      ...prev,
      [dayIdx]: (prev[dayIdx] || []).filter(e => e.uid !== uid),
    }))

  const navBtn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 18,
    background: 'rgba(91,155,213,0.12)', color: '#5b9bd5',
    border: 'none', cursor: 'pointer',
  }

  const GRID_LINE = '#c5d9ed'
  const HEADER_BG = '#5b9bd5'
  const TODAY_COL_BG = 'rgba(91,155,213,0.08)'

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, fontStyle: 'italic', color: '#2a3a4a' }}>
          📅 לוח שבועי
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              padding: '6px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: weekOffset === 0 ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'rgba(91,155,213,0.1)',
              color: weekOffset === 0 ? 'white' : '#5b9bd5',
              border: 'none', cursor: 'pointer',
              boxShadow: weekOffset === 0 ? '0 3px 10px rgba(91,155,213,0.3)' : 'none',
            }}
          >
            היום
          </button>
          <button style={navBtn} onClick={() => setWeekOffset(w => w - 1)}>›</button>
          <button style={navBtn} onClick={() => setWeekOffset(w => w + 1)}>‹</button>
        </div>
      </div>

      {/* Grid card */}
      <div style={{
        background: 'white', borderRadius: '24px', overflow: 'auto',
        border: `1.5px solid ${GRID_LINE}`,
        boxShadow: '0 4px 20px rgba(91,155,213,0.1)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, minmax(0,1fr))', minWidth: '720px' }}>

          {/* Corner cell */}
          <div style={{ borderBottom: `1px solid ${GRID_LINE}`, borderInlineEnd: `1px solid ${GRID_LINE}`, background: HEADER_BG }} />

          {/* Day header cells */}
          {weekDates.map((date, i) => (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${GRID_LINE}`,
                borderInlineEnd: `1px solid ${GRID_LINE}`,
                background: HEADER_BG,
                padding: '8px 4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>
                {DAY_NAMES[i]}
              </div>
              <div style={{
                fontSize: '15px', fontWeight: 700,
                width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', margin: '0 auto',
                background: isToday(date) ? 'white' : 'transparent',
                color: isToday(date) ? HEADER_BG : 'white',
                boxShadow: isToday(date) ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
                {date.getDate()}
              </div>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div style={{
                borderBottom: `1px solid ${GRID_LINE}`,
                borderInlineEnd: `1px solid ${GRID_LINE}`,
                fontSize: '11px', fontWeight: 600, color: '#6a8a9a',
                minHeight: '60px', textAlign: 'center', paddingTop: '7px',
              }}>
                {hour}
              </div>

              {/* Day cells */}
              {weekDates.map((date, dayIdx) => {
                const events = getCellEvents(dayIdx, hour)
                const cellTasks = getCellTasks(date, hour)
                const todayCol = isToday(date)
                return (
                  <div
                    key={dayIdx}
                    className="schedule-cell"
                    style={{
                      borderBottom: `1px solid ${GRID_LINE}`,
                      borderInlineEnd: `1px solid ${GRID_LINE}`,
                      minHeight: '60px',
                      padding: '3px',
                      background: todayCol ? TODAY_COL_BG : 'white',
                      cursor: 'pointer',
                    }}
                    onClick={() => setModal({ dayIdx, hour })}
                  >
                    {events.map(ev => (
                      <div
                        key={ev.uid}
                        style={{
                          background: `${ev.categoryColor}1a`,
                          borderRight: `3px solid ${ev.categoryColor}`,
                          borderRadius: '8px',
                          padding: '2px 6px',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#2a3a4a',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span>{ev.categoryEmoji}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.activity}</span>
                        <button
                          onClick={e => { e.stopPropagation(); deleteEvent(dayIdx, ev.uid) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05555', fontSize: '11px', opacity: 0.6, flexShrink: 0, padding: 0 }}
                        >✕</button>
                      </div>
                    ))}
                    {cellTasks.map(task => (
                      <div
                        key={task.id}
                        style={{
                          background: 'rgba(91,155,213,0.1)',
                          borderRight: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                          borderRadius: '8px',
                          padding: '2px 6px',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#2a3a4a',
                          opacity: task.done ? 0.5 : 1,
                          cursor: 'pointer',
                          textDecoration: task.done ? 'line-through' : 'none',
                        }}
                        onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                      >
                        <span>✅</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal */}
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
              {DAY_NAMES[modal.dayIdx]} בשעה {modal.hour}
            </p>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: '14px', fontSize: '14px', outline: 'none', marginBottom: '12px', border: '1.5px solid rgba(91,155,213,0.25)', background: '#f0f6fd', color: '#2a3a4a', boxSizing: 'border-box' }}
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
              style={{ width: '100%', padding: '10px 16px', borderRadius: '14px', fontSize: '14px', outline: 'none', marginBottom: '20px', border: '1.5px solid rgba(91,155,213,0.25)', background: '#f0f6fd', color: '#2a3a4a', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addEvent}
                style={{ flex: 1, padding: '12px 0', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)', boxShadow: '0 4px 14px rgba(91,155,213,0.35)' }}
              >הוסף</button>
              <button
                onClick={() => setModal(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: '14px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(91,155,213,0.08)', color: '#5b9bd5' }}
              >ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
