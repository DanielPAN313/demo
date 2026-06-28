import { EventAgent } from '../agents/EventAgent'
import { ExplainAgent } from '../agents/ExplainAgent'
import { InteractionAgent } from '../agents/InteractionAgent'
import { PriorityAgent } from '../agents/PriorityAgent'
import { ScheduleAgent } from '../agents/ScheduleAgent'
import { StateAgent } from '../agents/StateAgent'
import type { Agent, AgentContext, AgentResult } from '../types'

const emptyResult = (): AgentResult => ({
  explanations: [],
  suggestedActions: [],
  agentMessages: [],
})

const mergeAgentResults = (current: AgentResult, next: AgentResult): AgentResult => ({
  schedulePlan: next.schedulePlan ?? current.schedulePlan,
  notifications: next.notifications ?? current.notifications,
  morningBrief: next.morningBrief ?? current.morningBrief,
  explanations: [...(current.explanations ?? []), ...(next.explanations ?? [])],
  suggestedActions: [...(current.suggestedActions ?? []), ...(next.suggestedActions ?? [])],
  agentMessages: [...(current.agentMessages ?? []), ...(next.agentMessages ?? [])],
})

export class AgentOrchestrator {
  private readonly agents: Agent[]

  constructor(agents: Agent[]) {
    this.agents = agents
  }

  run(context: AgentContext): AgentResult {
    return this.agents.reduce<AgentResult>((result, agent) => {
      try {
        return mergeAgentResults(result, agent.run(context))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        return mergeAgentResults(result, {
          explanations: [`${agent.name} failed: ${message}`],
        })
      }
    }, emptyResult())
  }
}

export const createDefaultOrchestrator = (): AgentOrchestrator =>
  new AgentOrchestrator([
    new PriorityAgent(),
    new StateAgent(),
    new ScheduleAgent(),
    new EventAgent(),
    new InteractionAgent(),
    new ExplainAgent(),
  ])
