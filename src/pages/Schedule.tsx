import React, { useState, useEffect } from 'react'
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

const ROW_HEIGHT = 56
const GRID_LINE = '#e8eef4'
const HEADER_BG = '#5b9bd5'
const TODAY_COL_BG = '#e8f1fa'

export default function Schedule() {
  const [schedule, setSchedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].label)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showHint, setShowHint] = useLocalStorage<boolean>('sb_calendar_hint', true)

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const today = new Date()
  const weekDates = getWeekDates(weekOffset)

  const dateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const isToday = (d: Date) => dateStr(d) === dateStr(today)

  const getCellEvents = (dayIdx: number, hour: string): ScheduleEvent[] =>
    (schedule[dayIdx] || []).filter(e => e.time === hour)

  const getCellTasks = (date: Date, hour: string): Task[] => {
    const ds = dateStr(date)
    const dayOfWeek = date.getDay()
    const coveredParentIds = new Set(
      tasks
        .filter(t => t.recurringParentId && t.dueDate === ds)
        .map(t => t.recurringParentId as string)
    )
    return tasks.filter(t => {
      const tHour = (t.dueTime || '09:00').slice(0, 2) + ':00'
      if (tHour !== hour) return false
      if (t.dueDate && !t.isRecurring && !t.recurringParentId) return t.dueDate === ds
      if (t.recurringParentId) return t.dueDate === ds
      if (t.isRecurring && !coveredParentIds.has(t.id)) {
        if (t.recurrenceType === 'daily') return true
        if (t.recurrenceType === 'weekly' || t.recurrenceType === 'custom') {
          return (t.recurrenceDays ?? []).includes(dayOfWeek)
        }
      }
      return false
    })
  }

  const toggleTask = (id: string, date: Date) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    if (task.isRecurring) {
      const ds = dateStr(date)
      const instance = tasks.find(t => t.recurringParentId === id && t.dueDate === ds)
      if (instance) {
        setTasks(prev => prev.map(t => t.id === instance.id ? { ...t, done: !t.done } : t))
      } else {
        setTasks(prev => [...prev, {
          id: crypto.randomUUID(),
          text: task.text,
          priority: task.priority,
          done: true,
          createdAt: new Date().toISOString(),
          dueDate: ds,
          dueTime: task.dueTime,
          recurringParentId: id,
        }])
      }
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    }
  }

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

  const curH = currentTime.getHours()
  const curM = currentTime.getMinutes()
  const timeLabel = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* Hint banner */}
      {showHint && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(91,155,213,0.09)',
          border: '1px solid rgba(91,155,213,0.18)',
          borderRadius: '14px',
          padding: '10px 16px',
          marginBottom: '14px',
          fontSize: '13px',
          color: '#3a6a9a',
          fontWeight: 500,
        }}>
          <span style={{ flex: 1 }}>💡 טיפ: לחצו על כל תא בלוח כדי להוסיף פעילות חדשה!</span>
          <button
            onClick={() => setShowHint(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5b9bd5', fontSize: '16px', lineHeight: 1, padding: '2px 6px', flexShrink: 0, opacity: 0.7 }}
          >✕</button>
        </div>
      )}

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
            השבוע
          </button>
          <button style={navBtn} onClick={() => setWeekOffset(w => w - 1)}>›</button>
          <button style={navBtn} onClick={() => setWeekOffset(w => w + 1)}>‹</button>
        </div>
      </div>

      {/* Grid card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflowX: 'auto',
        overflowY: 'visible',
        border: `1px solid ${GRID_LINE}`,
        boxShadow: '0 2px 16px rgba(91,155,213,0.1)',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div className="calendar-grid">

          {/* Corner cell */}
          <div style={{
            borderBottom: `0.5px solid ${GRID_LINE}`,
            borderInlineEnd: `0.5px solid ${GRID_LINE}`,
            background: HEADER_BG,
            position: 'sticky', right: 0, zIndex: 3,
          }} />

          {/* Day header cells */}
          {weekDates.map((date, i) => (
            <div
              key={i}
              style={{
                borderBottom: `0.5px solid ${GRID_LINE}`,
                borderInlineEnd: `0.5px solid ${GRID_LINE}`,
                background: HEADER_BG,
                padding: '8px 4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '3px', letterSpacing: '0.02em' }}>
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
          {HOURS.map((hour, hourIdx) => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div style={{
                borderBottom: `0.5px solid ${GRID_LINE}`,
                borderInlineEnd: `0.5px solid ${GRID_LINE}`,
                fontSize: '12px', fontWeight: 600, color: '#8aa8c7',
                minHeight: `${ROW_HEIGHT}px`,
                textAlign: 'center',
                paddingTop: '6px',
                position: 'sticky', right: 0, zIndex: 2, background: 'white',
              }}>
                {hour}
              </div>

              {/* Day cells */}
              {weekDates.map((date, dayIdx) => {
                const events = getCellEvents(dayIdx, hour)
                const cellTasks = getCellTasks(date, hour)
                const todayCol = isToday(date)
                const isEmpty = events.length === 0 && cellTasks.length === 0
                const rowBg = hourIdx % 2 === 0 ? 'white' : '#f7fafc'
                const cellBg = todayCol ? TODAY_COL_BG : rowBg
                const showTimeLine = todayCol && weekOffset === 0 && curH === parseInt(hour)

                return (
                  <div
                    key={dayIdx}
                    className="schedule-cell"
                    data-empty={isEmpty ? 'true' : 'false'}
                    style={{
                      borderBottom: `0.5px solid ${GRID_LINE}`,
                      borderInlineEnd: `0.5px solid ${GRID_LINE}`,
                      minHeight: `${ROW_HEIGHT}px`,
                      padding: '3px',
                      background: cellBg,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => setModal({ dayIdx, hour })}
                  >
                    {/* Current time indicator */}
                    {showTimeLine && (
                      <div style={{
                        position: 'absolute',
                        top: `${(curM / 60) * ROW_HEIGHT}px`,
                        left: 0, right: 0,
                        height: '2px',
                        background: '#e05555',
                        zIndex: 3,
                        pointerEvents: 'none',
                      }}>
                        <div style={{
                          position: 'absolute',
                          right: 2, top: -9,
                          fontSize: '9px', fontWeight: 700,
                          color: '#e05555',
                          background: 'white',
                          padding: '1px 3px',
                          borderRadius: '4px',
                          border: '1px solid rgba(224,85,85,0.2)',
                          lineHeight: 1.4,
                          whiteSpace: 'nowrap',
                        }}>
                          {timeLabel}
                        </div>
                      </div>
                    )}

                    {/* Schedule event chips */}
                    {events.map(ev => (
                      <div
                        key={ev.uid}
                        className="event-chip"
                        style={{
                          background: `${ev.categoryColor}18`,
                          borderRight: `4px solid ${ev.categoryColor}`,
                          borderRadius: '8px',
                          padding: '3px 5px',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '3px',
                          cursor: 'default',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ flexShrink: 0, fontSize: '11px', lineHeight: '16px' }}>{ev.categoryEmoji}</span>
                        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 500, color: '#2a3a4a', lineHeight: '16px' }}>{ev.activity}</div>
                          <div style={{ fontSize: '10px', color: '#6a8a9a', lineHeight: '13px' }}>{ev.time}</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteEvent(dayIdx, ev.uid) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05555', fontSize: '10px', opacity: 0.45, flexShrink: 0, padding: 0, lineHeight: 1, marginTop: '2px' }}
                        >✕</button>
                      </div>
                    ))}

                    {/* Task chips */}
                    {cellTasks.map(task => (
                      <div
                        key={task.id}
                        className="event-chip"
                        style={{
                          background: `${PRIORITY_COLORS[task.priority]}14`,
                          borderRight: `4px solid ${PRIORITY_COLORS[task.priority]}`,
                          borderRadius: '8px',
                          padding: '3px 5px',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '3px',
                          opacity: task.done ? 0.45 : 1,
                          cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); toggleTask(task.id, date) }}
                      >
                        <span style={{ flexShrink: 0, fontSize: '11px', lineHeight: '16px' }}>
                          {task.isRecurring || task.recurringParentId ? '🔄' : '✅'}
                        </span>
                        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                          <div style={{
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: '12px', fontWeight: 500, color: '#2a3a4a', lineHeight: '16px',
                            textDecoration: task.done ? 'line-through' : 'none',
                          }}>{task.text}</div>
                          <div style={{ fontSize: '10px', color: '#6a8a9a', lineHeight: '13px' }}>{task.dueTime || '09:00'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Add event modal */}
      {modal && (
        <div
          className="calendar-modal-backdrop"
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(42,58,74,0.4)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="calendar-modal"
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
