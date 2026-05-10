import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useRecurringTasks } from '../hooks/useRecurringTasks'
import type { Task, Priority } from '../types'

type Filter = 'הכל' | 'פתוחות' | 'הושלמו' | 'דחופות'

const PRIORITY_COLORS: Record<Priority, string> = {
  'דחוף': '#e05555',
  'בינוני': '#d4960a',
  'רגיל': '#3aaa6d',
}
const PRIORITY_BG: Record<Priority, string> = {
  'דחוף': 'rgba(224,85,85,0.08)',
  'בינוני': 'rgba(212,150,10,0.08)',
  'רגיל': 'rgba(58,170,109,0.08)',
}
const PRIORITY_ORDER: Record<Priority, number> = { 'דחוף': 0, 'בינוני': 1, 'רגיל': 2 }

const DAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

const ESTIMATE_OPTIONS = [
  { label: '10 דקות', value: 10 },
  { label: '20 דקות', value: 20 },
  { label: '30 דקות', value: 30 },
  { label: '45 דקות', value: 45 },
  { label: 'שעה', value: 60 },
  { label: 'שעתיים', value: 120 },
  { label: '3+ שעות', value: 180 },
]

const fmtEstimate = (mins: number) => {
  if (mins < 60) return `${mins} דק׳`
  if (mins === 60) return 'שעה'
  if (mins === 120) return 'שעתיים'
  return `${mins / 60} שעות`
}

const card: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'white',
  borderRadius: '24px',
  border: '1px solid rgba(91,155,213,0.12)',
  boxShadow: '0 4px 18px rgba(91,155,213,0.1)',
}

const inputStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '14px',
  fontSize: '14px',
  outline: 'none',
  border: '1.5px solid rgba(91,155,213,0.25)',
  background: '#f0f6fd',
  color: '#2a3a4a',
  boxSizing: 'border-box',
}

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('בינוני')
  const [filter, setFilter] = useState<Filter>('הכל')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('09:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'custom'>('weekly')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useRecurringTasks(tasks, setTasks)

  const addTask = () => {
    if (!text.trim()) return
    const recurringDaysToSave =
      recurrenceType === 'custom' ? recurrenceDays :
      recurrenceType === 'weekly' ? [new Date().getDay()] : []
    setTasks(prev => [{
      id: crypto.randomUUID(),
      text: text.trim(),
      priority,
      done: false,
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate, dueTime } : {}),
      ...(estimatedMinutes ? { estimatedMinutes } : {}),
      ...(isRecurring ? {
        isRecurring: true,
        recurrenceType,
        recurrenceDays: recurringDaysToSave,
      } : {}),
    }, ...prev])
    setText('')
    setDueDate('')
    setDueTime('09:00')
    setEstimatedMinutes(null)
    setIsRecurring(false)
    setRecurrenceDays([])
    setRecurrenceType('weekly')
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    if (task.isRecurring) {
      const todayStr = fmt(new Date())
      const instance = tasks.find(t => t.recurringParentId === id && t.dueDate === todayStr)
      if (instance) {
        setTasks(prev => prev.map(t => t.id === instance.id ? { ...t, done: !t.done } : t))
      } else {
        setTasks(prev => [{
          id: crypto.randomUUID(),
          text: task.text,
          priority: task.priority,
          done: true,
          createdAt: new Date().toISOString(),
          dueDate: todayStr,
          dueTime: task.dueTime,
          recurringParentId: id,
          ...(task.estimatedMinutes ? { estimatedMinutes: task.estimatedMinutes } : {}),
        }, ...prev])
      }
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    }
  }

  const handleDeleteClick = (task: Task) => {
    if (task.isRecurring || task.recurringParentId) {
      setDeleteConfirm(task.id)
    } else {
      setTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }

  const confirmDelete = (task: Task, mode: 'single' | 'all') => {
    if (mode === 'single') {
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } else {
      const parentId = task.recurringParentId || task.id
      setTasks(prev => prev.filter(t => t.id !== parentId && t.recurringParentId !== parentId))
    }
    setDeleteConfirm(null)
  }

  const toggleDay = (day: number) =>
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )

  const filtered = tasks
    .filter(t => {
      if (filter === 'פתוחות') return !t.done
      if (filter === 'הושלמו') return t.done
      if (filter === 'דחופות') return t.priority === 'דחוף' && !t.done
      return true
    })
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    })

  const filters: Filter[] = ['הכל', 'פתוחות', 'הושלמו', 'דחופות']

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#2a3a4a', marginBottom: '24px' }}>
        ✅ משימות
      </h1>

      {/* Add form */}
      <div className="task-form-card" style={{ ...card, padding: '20px', marginBottom: '16px' }}>
        {/* Main inputs row */}
        <div className="task-form-fields">
          <input
            type="text"
            className="task-text-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="הוסיפו משימה חדשה..."
            style={{ ...inputStyle }}
          />
          <div className="task-form-meta">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              style={{ ...inputStyle, fontWeight: 600, cursor: 'pointer', color: PRIORITY_COLORS[priority] }}
            >
              <option value="דחוף">דחוף</option>
              <option value="בינוני">בינוני</option>
              <option value="רגיל">רגיל</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              title="תאריך (אופציונלי)"
              placeholder="תאריך (אופציונלי)"
              style={{ ...inputStyle, cursor: 'pointer', color: dueDate ? '#2a3a4a' : '#6a8fa8' }}
            />
            {dueDate && (
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              />
            )}
            <select
              value={estimatedMinutes ?? ''}
              onChange={e => setEstimatedMinutes(e.target.value ? Number(e.target.value) : null)}
              style={{ ...inputStyle, cursor: 'pointer', color: estimatedMinutes ? '#2a3a4a' : '#6a8fa8' }}
            >
              <option value="">⏱️ זמן משוער</option>
              {ESTIMATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            className="task-add-btn"
            onClick={addTask}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #5b9bd5, #4a8ac7)',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              boxShadow: '0 4px 12px rgba(91,155,213,0.3)',
            }}
          >
            + הוסף
          </button>
        </div>

        {/* Recurring toggle (below main row) */}
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setIsRecurring(r => !r)}
            style={{
              background: isRecurring ? 'rgba(91,155,213,0.12)' : 'transparent',
              border: '1.5px solid rgba(91,155,213,0.2)',
              borderRadius: '14px',
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: isRecurring ? '#5b9bd5' : '#6a8fa8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔄 משימה חוזרת?
            <span style={{ fontSize: '10px', opacity: 0.7 }}>{isRecurring ? '▲' : '▼'}</span>
          </button>

          {isRecurring && (
            <div style={{
              marginTop: '10px',
              padding: '12px 16px',
              background: 'rgba(91,155,213,0.05)',
              borderRadius: '14px',
              border: '1px solid rgba(91,155,213,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {/* Frequency selector */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['daily', 'weekly', 'custom'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setRecurrenceType(type)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: recurrenceType === type ? '#5b9bd5' : 'rgba(91,155,213,0.1)',
                      color: recurrenceType === type ? 'white' : '#5b9bd5',
                    }}
                  >
                    {type === 'daily' ? 'כל יום' : type === 'weekly' ? 'כל שבוע' : 'ימים מותאמים'}
                  </button>
                ))}
              </div>

              {/* Custom day pickers */}
              {recurrenceType === 'custom' && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: recurrenceDays.includes(i) ? '#5b9bd5' : 'rgba(91,155,213,0.1)',
                        color: recurrenceDays.includes(i) ? 'white' : '#5b9bd5',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {recurrenceType === 'weekly' && (
                <p style={{ fontSize: '12px', color: '#6a8fa8', margin: 0 }}>
                  תחזור כל שבוע ביום {DAY_LABELS[new Date().getDay()]}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filter === f ? 'linear-gradient(135deg, #5b9bd5, #4a8ac7)' : 'rgba(91,155,213,0.08)',
              color: filter === f ? 'white' : '#5b9bd5',
              border: filter === f ? 'none' : '1px solid rgba(91,155,213,0.2)',
              boxShadow: filter === f ? '0 4px 12px rgba(91,155,213,0.25)' : 'none',
              boxSizing: 'border-box',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ ...card, padding: '32px', textAlign: 'center', color: '#6a8fa8', fontSize: '14px' }}>
            אין משימות להצגה
          </div>
        )}
        {filtered.map(task => (
          <div key={task.id}>
            <div
              style={{
                ...card,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRight: `4px solid ${PRIORITY_COLORS[task.priority]}`,
                opacity: task.done ? 0.65 : 1,
                boxShadow: '0 2px 10px rgba(91,155,213,0.08)',
              }}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#5b9bd5', flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: '#2a3a4a',
                  textDecoration: task.done ? 'line-through' : 'none',
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {(task.isRecurring || task.recurringParentId) && (
                  <span style={{ fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>🔄</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.text}
                </span>
              </span>
              {task.dueDate && (
                <span style={{ fontSize: '12px', color: '#6a8fa8', flexShrink: 0 }}>
                  📅 {task.dueDate} {task.dueTime}
                </span>
              )}
              {task.estimatedMinutes && (
                <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '999px', fontWeight: 600, flexShrink: 0, background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                  ⏱️ {fmtEstimate(task.estimatedMinutes)}
                </span>
              )}
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontWeight: 600,
                  flexShrink: 0,
                  background: PRIORITY_BG[task.priority],
                  color: PRIORITY_COLORS[task.priority],
                }}
              >
                {task.priority}
              </span>
              <button
                onClick={() => handleDeleteClick(task)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                  flexShrink: 0,
                  color: '#e05555',
                  background: 'rgba(224,85,85,0.08)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Delete confirmation for recurring tasks */}
            {deleteConfirm === task.id && (
              <div style={{
                background: 'rgba(224,85,85,0.05)',
                border: '1px solid rgba(224,85,85,0.15)',
                borderRadius: '14px',
                padding: '10px 14px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '13px', color: '#2a3a4a', flex: 1, minWidth: '160px' }}>
                  למחוק רק את המשימה הזו או את כל החזרות?
                </span>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => confirmDelete(task, 'single')}
                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#e05555', color: 'white' }}
                  >
                    רק זו
                  </button>
                  <button
                    onClick={() => confirmDelete(task, 'all')}
                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(224,85,85,0.12)', color: '#e05555' }}
                  >
                    כל החזרות
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(91,155,213,0.1)', color: '#5b9bd5' }}
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
