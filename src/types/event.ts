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
  url?: string
  repo?: string
  kind?: 'issue' | 'pull_request' | 'notification' | 'review_request' | 'mention'
}

export type NotificationItem = {
  id: ID
  title: string
  channel: NotificationChannel
  sourceEventId?: ID
  reason: string
  createdAt: string
}

export type GitHubInboxItem = {
  id: ID
  title: string
  repo: string
  url: string
  kind: 'issue' | 'pull_request' | 'notification' | 'review_request' | 'mention'
  reason: string
  updatedAt: string
  labels: string[]
  priority: Priority
  requiredAction: boolean
  estimatedMinutes: number
  summary: string
}

