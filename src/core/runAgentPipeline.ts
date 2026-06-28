import type { AgentResult } from '../types'
import { createDefaultOrchestrator } from './AgentOrchestrator'
import { createAgentContext } from './createAgentContext'
import type { AgentRuntimeEvent } from './agentEvents'

export const runAgentPipeline = (event?: AgentRuntimeEvent): AgentResult => {
  const context = createAgentContext(event)
  const orchestrator = createDefaultOrchestrator()

  return orchestrator.run(context)
}

