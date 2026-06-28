import type { ID, NotificationChannel, Priority } from './common'

export type ExternalEventSource = 'github' | 'message' | 'course' | 'calendar' | 'system'

export type ExternalEvent = {
  id: ID
  title: string
  source: ExternalEventSource
  priority: Priority
  receivedAt: string
  requiredAction: boolean
  estimatedMinutes?: number
  interruptLevel: NotificationChannel
  summary: string
  relatedTaskId?: ID
}

export type NotificationItem = {
  id: ID
  title: string
  channel: NotificationChannel
  sourceEventId?: ID
  reason: string
  createdAt: string
}

