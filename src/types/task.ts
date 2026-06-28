import type { ID, Priority } from './common'

export type TaskIntensity = 'deep' | 'medium' | 'light' | 'recovery'

export type TaskCategory =
  | 'coding'
  | 'study'
  | 'communication'
  | 'review'
  | 'health'
  | 'admin'
  | 'creative'

export type TaskStatus = 'pending' | 'scheduled' | 'done' | 'deferred'

export type TaskSource = 'user' | 'github' | 'calendar' | 'message' | 'system'

export type Task = {
  id: ID
  title: string
  priority: Priority
  deadline?: string
  estimatedMinutes: number
  intensity: TaskIntensity
  category: TaskCategory
  splittable: boolean
  status: TaskStatus
  source: TaskSource
  description?: string
  tags?: string[]
}

