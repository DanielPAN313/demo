import type { AgentEventType, ID, Priority } from './common'
import type { ExternalEvent, NotificationItem } from './event'
import type { FixedSchedule, SchedulePlan } from './schedule'
import type { Task } from './task'
import type { UserState } from './user'
import type { MorningBrief } from '../modules/morningBrief'

export type PlanningInsight = {
  objective: string
  taskBreakdown: string[]
  constraints: string[]
  conflicts: string[]
  schedule: Array<{
    date: string
    startTime: string
    endTime: string
    title: string
    priority: Priority
    reason: string
  }>
  researchSummary?: string[]
}

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
  planningInsight?: PlanningInsight
}

export type AgentResult = {
  schedulePlan?: SchedulePlan
  notifications?: NotificationItem[]
  morningBrief?: MorningBrief
  explanations?: string[]
  suggestedActions?: SuggestedAction[]
  agentMessages?: AgentMessage[]
  planningInsight?: PlanningInsight
}

export type AgentRunResult = AgentResult | Promise<AgentResult>

export interface Agent {
  name: string
  run(context: AgentContext): AgentRunResult
}
