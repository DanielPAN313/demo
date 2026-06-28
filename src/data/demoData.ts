import type { ExternalEvent, ScheduleBlock, Task, UserState } from '../types'

export const initialUserState: UserState = {
  sleepScore: 62,
  fatigueLevel: 'medium',
  stressLevel: 'medium',
  mood: 'normal',
  energyLevel: 'medium',
  focusCapacity: 45,
  lastUpdated: new Date(0).toISOString(),
}

export const demoTasks: Task[] = [
  {
    id: 'task-deep-agent',
    title: 'Agent decision loop prototype',
    priority: 'P1',
    estimatedMinutes: 90,
    intensity: 'deep',
    category: 'coding',
    splittable: true,
    status: 'pending',
    source: 'user',
  },
]

export const baselineSchedule: ScheduleBlock[] = [
  {
    id: 'morning-focus',
    title: 'Deep work sprint',
    startTime: '09:00',
    endTime: '11:30',
    type: 'focus',
    sourceType: 'task',
    sourceId: 'task-deep-agent',
    priority: 'P1',
  },
]

export const urgentGithubEvent: ExternalEvent = {
  id: 'event-github-p1',
  title: 'GitHub P1 issue: demo route fails on mobile',
  source: 'github',
  priority: 'P1',
  receivedAt: new Date(0).toISOString(),
  requiredAction: true,
  estimatedMinutes: 25,
  interruptLevel: 'immediate',
  summary: 'A high-priority GitHub issue requires demo-path attention.',
}

export const nightDigestEvents: ExternalEvent[] = [
  {
    id: 'event-message-night',
    title: 'Teammate posted copy notes at 01:12',
    source: 'message',
    priority: 'P3',
    receivedAt: new Date(0).toISOString(),
    requiredAction: false,
    interruptLevel: 'digest',
    summary: 'Copy notes were received overnight.',
  },
]

