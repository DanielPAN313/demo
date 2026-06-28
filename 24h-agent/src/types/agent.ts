import type { AgentEventType, ID } from './common'
import type { ExternalEvent, NotificationItem } from './event'
import type { FixedSchedule, SchedulePlan } from './schedule'
import type { Task } from './task'
import type { UserState } from './user'
import type { MorningBrief } from '../modules/morningBrief'

export type AgentMessage = {
  id: ID
  role: 'system' | 'agent' | 'user'
  content: string
  createdAt: string
}

export type SuggestedAction = {
  id: ID
  label: string
  type: 'reschedule' | 'confirm' | 'dismiss' | 'open_brief' | 'start_focus'
  payload?: Record<string, unknown>
}

export type AgentContext = {
  fixedSchedules: FixedSchedule[]
  tasks: Task[]
  userState: UserState
  externalEvents: ExternalEvent[]
  schedulePlan?: SchedulePlan
  notifications: NotificationItem[]
  agentMessages: AgentMessage[]
  currentTime: string
  eventType: AgentEventType
  userCommand?: string
}

export type AgentResult = {
  schedulePlan?: SchedulePlan
  notifications?: NotificationItem[]
  morningBrief?: MorningBrief
  explanations?: string[]
  suggestedActions?: SuggestedAction[]
  agentMessages?: AgentMessage[]
}

export interface Agent {
  name: string
  run(context: AgentContext): AgentResult
}
