import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
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

const card: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'white',
  borderRadius: '18px',
  border: '1px solid rgba(34,139,120,0.08)',
  boxShadow: '0 2px 12px rgba(34,139,120,0.08)',
}

export default function Tasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('sb_tasks', [])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('בינוני')
  const [filter, setFilter] = useState<Filter>('הכל')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('09:00')

  const addTask = () => {
    if (!text.trim()) return
    setTasks(prev => [{
      id: crypto.randomUUID(),
      text: text.trim(),
      priority,
      done: false,
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate, dueTime } : {}),
    }, ...prev])
    setText('')
    setDueDate('')
    setDueTime('09:00')
  }

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id))

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
    <div
      className="fade-in"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#2a3b33', marginBottom: '24px' }}>
        📝 משימות
      </h1>

      {/* Add form */}
      <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="הוסיפו משימה חדשה..."
            style={{
              flex: '1 1 200px',
              minWidth: 0,
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              border: '1.5px solid rgba(34,139,120,0.2)',
              background: '#f8fdfc',
              color: '#2a3b33',
              boxSizing: 'border-box',
            }}
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              border: '1.5px solid rgba(34,139,120,0.2)',
              background: '#f8fdfc',
              color: PRIORITY_COLORS[priority],
              boxSizing: 'border-box',
            }}
          >
            <option value="דחוף">דחוף</option>
            <option value="בינוני">בינוני</option>
            <option value="רגיל">רגיל</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              border: '1.5px solid rgba(34,139,120,0.2)',
              background: '#f8fdfc',
              color: dueDate ? '#2a3b33' : '#5a8a78',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          />
          {dueDate && (
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                border: '1.5px solid rgba(34,139,120,0.2)',
                background: '#f8fdfc',
                color: '#2a3b33',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            />
          )}
          <button
            onClick={addTask}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #228b78, #2ba08a)',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            + הוסף
          </button>
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
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filter === f ? 'linear-gradient(135deg, #228b78, #2ba08a)' : 'rgba(34,139,120,0.06)',
              color: filter === f ? 'white' : '#5a8a78',
              border: filter === f ? 'none' : '1px solid rgba(34,139,120,0.15)',
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
          <div style={{ ...card, padding: '32px', textAlign: 'center', color: '#5a8a78', fontSize: '14px' }}>
            אין משימות להצגה
          </div>
        )}
        {filtered.map(task => (
          <div
            key={task.id}
            style={{
              ...card,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRight: `4px solid ${PRIORITY_COLORS[task.priority]}`,
              opacity: task.done ? 0.65 : 1,
              boxShadow: '0 1px 6px rgba(34,139,120,0.06)',
            }}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#228b78', flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                fontSize: '14px',
                color: '#2a3b33',
                textDecoration: task.done ? 'line-through' : 'none',
                minWidth: 0,
              }}
            >
              {task.text}
            </span>
            {task.dueDate && (
              <span style={{ fontSize: '12px', color: '#5a8a78', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                📅 {task.dueDate} {task.dueTime}
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
              onClick={() => deleteTask(task.id)}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
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
        ))}
      </div>
    </div>
  )
}
