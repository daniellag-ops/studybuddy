export type Priority = 'דחוף' | 'בינוני' | 'רגיל'

export interface Task {
  id: string
  text: string
  priority: Priority
  done: boolean
  createdAt: string
}

export interface ScheduleEvent {
  uid: string
  time: string
  category: string
  categoryEmoji: string
  categoryColor: string
  activity: string
}

export type ScheduleData = Record<number, ScheduleEvent[]>
