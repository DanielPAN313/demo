import type { Agent, AgentContext, AgentResult } from '../types'

const createPlaceholderAgent = (name: string): Agent => ({
  name,
  run: (context: AgentContext): AgentResult => ({
    schedulePlan: context.schedulePlan,
    notifications: context.notifications,
    agentMessages: context.agentMessages,
    explanations: [`${name} placeholder executed.`],
    suggestedActions: [{ id: `placeholder-${name}`, label: `${name} done`, type: 'dismiss' }],
  }),
})

export const planningAgent = createPlaceholderAgent('PlanningAgent')
export const stateAgent = createPlaceholderAgent('StateAgent')
export const eventAgent = createPlaceholderAgent('EventAgent')
export const interactionAgent = createPlaceholderAgent('InteractionAgent')
export const explainAgent = createPlaceholderAgent('ExplainAgent')

export const placeholderAgents: Agent[] = [
  planningAgent,
  stateAgent,
  eventAgent,
  interactionAgent,
  explainAgent,
]
