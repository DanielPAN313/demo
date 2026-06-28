import type { AgentEventType, ExternalEvent, Task, UserState } from '../types'

export type AgentEventPayload = {
  userState?: UserState
  externalEvent?: ExternalEvent
  command?: string
  task?: Task
  timestamp?: string
}

export type AgentRuntimeEvent = {
  type: AgentEventType
  payload?: AgentEventPayload
}

export const createAgentEvent = (
  type: AgentEventType,
  payload?: AgentEventPayload,
): AgentRuntimeEvent => ({
  type,
  payload,
})

