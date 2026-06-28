export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

export type TaskStatus = 'todo' | 'scheduled' | 'deferred' | 'done'

export type ScheduleType = 'fixed' | 'focus' | 'micro' | 'rest' | 'event'

export type NotificationBucket =
  | 'immediate'
  | 'later'
  | 'morning'
  | 'silent'

export type DemoScenario =
  | 'normal'
  | 'sleepPoor'
  | 'stressHigh'
  | 'githubP1'
  | 'nightMode'
  | 'morningBrief'

export interface FixedSchedule {
  id: string
  title: string
  type: 'sleep' | 'meal' | 'commute' | 'class' | 'exercise' | 'rest'
  startTime: string
  endTime: string
  locked: boolean
  location?: string
  description?: string
}

export interface Task {
  id: string
  title: string
  priority: Priority
  deadline: string
  estimatedMinutes: number
  intensity: 'low' | 'medium' | 'high'
  category: 'dev' | 'study' | 'communication' | 'review' | 'wellness' | 'admin'
  status: TaskStatus
  source: 'manual' | 'course' | 'github' | 'agent'
  description?: string
}

export interface UserState {
  sleepScore: number
  fatigueLevel: number
  stressLevel: number
  mood: 'calm' | 'flat' | 'tense' | 'focused'
  energyLevel: number
  focusCapacity: number
}

export interface ExternalEvent {
  id: string
  title: string
  source: 'GitHub' | 'Course' | 'Chat' | 'System'
  priority: Priority
  receivedAt: string
  interruptLevel: number
  estimatedMinutes: number
  summary: string
}

export interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  type: ScheduleType
  sourceId: string
  priority?: Priority
  reason: string
}

export interface NotificationItem {
  id: string
  title: string
  bucket: NotificationBucket
  source: ExternalEvent['source']
  priority: Priority
  reason: string
}

export interface AgentMessage {
  agent: string
  text: string
}

export interface AgentContext {
  fixedSchedules: FixedSchedule[]
  tasks: Task[]
  userState: UserState
  externalEvents: ExternalEvent[]
  currentTime: string
  schedulePlan: ScheduleBlock[]
}

export interface AgentResult {
  updatedSchedule: ScheduleBlock[]
  notifications: NotificationItem[]
  explanations: string[]
  suggestedActions: string[]
  agentMessages: AgentMessage[]
  morningBrief: string[]
  stateLabel: string
}
