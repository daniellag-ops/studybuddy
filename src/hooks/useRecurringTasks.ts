import { useEffect } from 'react'
import type { Task } from '../types'

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function useRecurringTasks(
  tasks: Task[],
  setTasks: (fn: (prev: Task[]) => Task[]) => void
) {
  useEffect(() => {
    const today = new Date()
    const todayStr = fmt(today)
    const todayDay = today.getDay()
    const newInstances: Task[] = []

    for (const task of tasks) {
      if (!task.isRecurring) continue
      const days = task.recurrenceDays ?? []
      const matches =
        task.recurrenceType === 'daily' ||
        ((task.recurrenceType === 'weekly' || task.recurrenceType === 'custom') &&
          days.includes(todayDay))
      if (!matches) continue
      const exists = tasks.some(
        t => t.recurringParentId === task.id && t.dueDate === todayStr
      )
      if (exists) continue
      newInstances.push({
        id: crypto.randomUUID(),
        text: task.text,
        priority: task.priority,
        done: false,
        createdAt: new Date().toISOString(),
        dueDate: todayStr,
        dueTime: task.dueTime,
        recurringParentId: task.id,
      })
    }

    if (newInstances.length > 0) {
      setTasks(prev => [...newInstances, ...prev])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
