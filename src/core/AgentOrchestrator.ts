import { EventAgent } from '../agents/EventAgent'
import { ExplainAgent } from '../agents/ExplainAgent'
import { InteractionAgent } from '../agents/InteractionAgent'
import { PlanningAgent } from '../agents/PlanningAgent'
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
  planningInsight: next.planningInsight ?? current.planningInsight,
  explanations: [...(current.explanations ?? []), ...(next.explanations ?? [])],
  suggestedActions: [...(current.suggestedActions ?? []), ...(next.suggestedActions ?? [])],
  agentMessages: [...(current.agentMessages ?? []), ...(next.agentMessages ?? [])],
})

const applyResultToContext = (
  context: AgentContext,
  result: AgentResult,
): AgentContext => ({
  ...context,
  schedulePlan: result.schedulePlan ?? context.schedulePlan,
  notifications: result.notifications ?? context.notifications,
  agentMessages: [...context.agentMessages, ...(result.agentMessages ?? [])],
  planningInsight: result.planningInsight ?? context.planningInsight,
})

export class AgentOrchestrator {
  private readonly agents: Agent[]

  constructor(agents: Agent[]) {
    this.agents = agents
  }

  async run(context: AgentContext): Promise<AgentResult> {
    let result = emptyResult()
    let currentContext = context

    for (const agent of this.agents) {
      try {
        const nextResult = await agent.run(currentContext)
        result = mergeAgentResults(result, nextResult)
        currentContext = applyResultToContext(currentContext, nextResult)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        const nextResult = {
          explanations: [`${agent.name} failed: ${message}`],
        }

        result = mergeAgentResults(result, nextResult)
        currentContext = applyResultToContext(currentContext, nextResult)
      }
    }

    return result
  }
}

export const createDefaultOrchestrator = (): AgentOrchestrator =>
  new AgentOrchestrator([
    new PlanningAgent(),
    new StateAgent(),
    new EventAgent(),
    new InteractionAgent(),
    new ExplainAgent(),
  ])
