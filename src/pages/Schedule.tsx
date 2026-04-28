import React, { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ScheduleData, ScheduleEvent } from '../types'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const CATEGORIES = [
  { label: 'לימודים', emoji: '📖', color: '#3581b8' },
  { label: 'חברים', emoji: '👫', color: '#c44daa' },
  { label: 'תחביב', emoji: '🎨', color: '#228b78' },
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

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold" style={{ color: '#2a3b33' }}>
          📅 לוח שבועי
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: weekOffset === 0 ? 'linear-gradient(135deg, #228b78, #2ba08a)' : 'rgba(34,139,120,0.08)',
              color: weekOffset === 0 ? 'white' : '#5a8a78',
            }}
          >
            היום
          </button>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(34,139,120,0.08)', color: '#228b78' }}
          >
            ›
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all hover:opacity-80"
            style={{ background: 'rgba(34,139,120,0.08)', color: '#228b78' }}
          >
            ‹
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="bg-white rounded-[18px] overflow-auto"
        style={{
          border: '1px solid rgba(34,139,120,0.08)',
          boxShadow: '0 2px 12px rgba(34,139,120,0.08)',
        }}
      >
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: '70px repeat(7, minmax(0, 1fr))', minWidth: '700px' }}
        >
          {/* Header row */}
          <div className="border-b border-r" style={{ borderColor: 'rgba(34,139,120,0.1)' }} />
          {weekDates.map((date, i) => (
            <div
              key={i}
              className="border-b border-r p-2 text-center"
              style={{ borderColor: 'rgba(34,139,120,0.1)' }}
            >
              <div className="text-xs font-semibold" style={{ color: '#5a8a78' }}>
                {DAY_NAMES[i]}
              </div>
              <div
                className="text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5"
                style={{
                  background: isToday(date) ? 'linear-gradient(135deg, #228b78, #2ba08a)' : 'transparent',
                  color: isToday(date) ? 'white' : '#2a3b33',
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
                className="border-b border-r px-2 py-2 text-xs font-semibold"
                style={{
                  borderColor: 'rgba(34,139,120,0.1)',
                  color: '#5a8a78',
                  minHeight: '56px',
                  textAlign: 'center',
                }}
              >
                {hour}
              </div>
              {weekDates.map((_, dayIdx) => {
                const events = getCellEvents(dayIdx, hour)
                return (
                  <div
                    key={dayIdx}
                    className="border-b border-r schedule-cell cursor-pointer"
                    style={{
                      borderColor: 'rgba(34,139,120,0.1)',
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
                          color: '#2a3b33',
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
                          style={{ color: '#e05555' }}
                        >
                          ✕
                        </button>
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
            background: 'rgba(42,59,51,0.35)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '420px',
              width: '90%',
              boxSizing: 'border-box',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2a3b33', marginBottom: '4px' }}>
              הוספת אירוע
            </h3>
            <p style={{ fontSize: '13px', color: '#5a8a78', marginBottom: '20px' }}>
              {DAY_NAMES[modal.dayIdx]} בשעה {modal.hour}
            </p>

            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '12px',
                border: '1.5px solid rgba(34,139,120,0.2)',
                background: '#f8fdfc',
                color: '#2a3b33',
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
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '20px',
                border: '1.5px solid rgba(34,139,120,0.2)',
                background: '#f8fdfc',
                color: '#2a3b33',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addEvent}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #228b78, #2ba08a)',
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
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(34,139,120,0.08)',
                  color: '#5a8a78',
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
