export type ID = string

export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

export type TimeBlockType = 'focus' | 'micro' | 'rest' | 'sleep' | 'fixed' | 'buffer'

export type NotificationChannel = 'immediate' | 'defer' | 'digest' | 'silent'

export type AgentEventType =
  | 'INIT'
  | 'USER_STATE_CHANGED'
  | 'EXTERNAL_EVENT_INSERTED'
  | 'USER_COMMAND'
  | 'NIGHT_MODE_STARTED'
  | 'MORNING_BRIEF_REQUESTED'

