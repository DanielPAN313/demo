import type { ID, Priority, TimeBlockType } from './common'

export type FixedSchedule = {
  id: ID
  title: string
  type: 'class' | 'meeting' | 'sleep' | 'commute' | 'exercise' | 'meal' | 'personal'
  startTime: string
  endTime: string
  locked: boolean
  location?: string
  description?: string
}

export type ScheduleBlock = {
  id: ID
  title: string
  date?: string
  startTime: string
  endTime: string
  type: TimeBlockType
  sourceType: 'fixed' | 'task' | 'event' | 'recovery' | 'buffer'
  sourceId?: ID
  priority?: Priority
  reason?: string
  isAdjusted?: boolean
}

export type SchedulePlan = {
  date: string
  blocks: ScheduleBlock[]
  summary: string
  generatedAt: string
  horizonDays?: number
}

