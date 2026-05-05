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
  const sundayDiff = -today.getDay() + weekOffset * 7
  const sunday = new Date(today)
  sunday.setDate(today.getDate() + sundayDiff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

interface ModalState {
  dayIdx: number
  hour: string
}

export default function Schedule() {
  const [schedule, setSchedule] = useLocalStorage<ScheduleData>('sb_schedule', {})
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].label)

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const getCellEvents = (dayIdx: number, hour: string): ScheduleEvent[] =>
    (schedule[dayIdx] || []).filter(e => e.time === hour)

  const dateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const getCellTasks = (date: Date, hour: string): Task[] =>
    tasks.filter(t => {
      if (!t.dueDate) return false
      if (t.dueDate !== dateStr(date)) return false
      const taskHour = (t.dueTime || '09:00').slice(0, 2) + ':00'
      return taskHour === hour
    })

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const addEvent = () => {
    if (!modal || !newActivity.trim()) return
    const cat = CATEGORIES.find(c => c.label === newCategory)!
    const event: ScheduleEvent = {
      uid: crypto.randomUUID(),
      time: modal.hour,
      category: cat.label,
      categoryEmoji: cat.emoji,
      categoryColor: cat.color,
      activity: newActivity.trim(),
    }
    setSchedule(prev => ({
      ...prev,
      [modal.dayIdx]: [...(prev[modal.dayIdx] || []), event],
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

  const borderColor = 'rgba(197,217,237,0.8)'

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold" style={{ color: '#2a3a4a' }}>
          📅 לוח שבועי
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: weekOffset === 0 ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'rgba(91,155,213,0.1)',
              color: weekOffset === 0 ? 'white' : '#5b9bd5',
              border: 'none',
              cursor: 'pointer',
              boxShadow: weekOffset === 0 ? '0 4px 12px rgba(91,155,213,0.3)' : 'none',
            }}
          >
            היום
          </button>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            style={{
              width: '32px', height: '32px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, background: 'rgba(91,155,213,0.1)',
              color: '#5b9bd5', border: 'none', cursor: 'pointer', fontSize: '18px',
            }}
          >
            ›
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            style={{
              width: '32px', height: '32px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, background: 'rgba(91,155,213,0.1)',
              color: '#5b9bd5', border: 'none', cursor: 'pointer', fontSize: '18px',
            }}
          >
            ‹
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          overflow: 'auto',
          border: '1.5px solid rgba(197,217,237,0.9)',
          boxShadow: '0 4px 20px rgba(91,155,213,0.1)',
        }}
      >
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))', minWidth: '700px' }}
        >
          {/* Header row */}
          <div style={{ borderBottom: `1px solid ${borderColor}`, borderInlineEnd: `1px solid ${borderColor}` }} />
          {weekDates.map((date, i) => (
            <div
              key={i}
              style={{
                borderBottom: `1px solid ${borderColor}`,
                borderInlineEnd: `1px solid ${borderColor}`,
                padding: '8px 4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6a8fa8' }}>
                {DAY_NAMES[i]}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  width: '28px',
                  height: '28px',
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
                  borderBottom: `1px solid ${borderColor}`,
                  borderInlineEnd: `1px solid ${borderColor}`,
                  padding: '4px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6a8fa8',
                  minHeight: '56px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
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
                      borderBottom: `1px solid ${borderColor}`,
                      borderInlineEnd: `1px solid ${borderColor}`,
                      minHeight: '56px',
                      padding: '3px',
                    }}
                    onClick={() => setModal({ dayIdx, hour })}
                  >
                    {events.map(ev => (
                      <div
                        key={ev.uid}
                        className="rounded-lg px-1.5 py-0.5 mb-0.5 flex items-center gap-1 text-xs"
                        style={{
                          background: `${ev.categoryColor}18`,
                          borderRight: `3px solid ${ev.categoryColor}`,
                          color: '#2a3a4a',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span>{ev.categoryEmoji}</span>
                        <span className="flex-1 truncate">{ev.activity}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            deleteEvent(dayIdx, ev.uid)
                          }}
                          className="text-xs opacity-50 hover:opacity-100 ml-auto"
                          style={{ color: '#e05555', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
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
                        onClick={e => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
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

      {/* Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(42,58,74,0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '420px',
              width: '90%',
              boxSizing: 'border-box',
              boxShadow: '0 20px 60px rgba(91,155,213,0.25)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2a3a4a', marginBottom: '4px' }}>
              הוספת אירוע
            </h3>
            <p style={{ fontSize: '13px', color: '#6a8fa8', marginBottom: '20px' }}>
              {DAY_NAMES[modal.dayIdx]} בשעה {modal.hour}
            </p>

            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '12px',
                border: '1.5px solid rgba(91,155,213,0.25)',
                background: '#f0f6fd',
                color: '#2a3a4a',
                boxSizing: 'border-box',
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.label} value={cat.label}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newActivity}
              onChange={e => setNewActivity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()}
              placeholder="מה תעשו?"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '20px',
                border: '1.5px solid rgba(91,155,213,0.25)',
                background: '#f0f6fd',
                color: '#2a3a4a',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addEvent}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)',
                  boxShadow: '0 4px 14px rgba(91,155,213,0.35)',
                  boxSizing: 'border-box',
                }}
              >
                הוסף
              </button>
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(91,155,213,0.08)',
                  color: '#5b9bd5',
                  boxSizing: 'border-box',
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
