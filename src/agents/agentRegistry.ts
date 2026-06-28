import { createDefaultOrchestrator } from '../core/AgentOrchestrator'

export const agentRegistry = {
  orchestrator: createDefaultOrchestrator(),
}

export type { Agent, AgentContext, AgentResult } from '../types'
export { AgentOrchestrator, createDefaultOrchestrator } from '../core/AgentOrchestrator'
