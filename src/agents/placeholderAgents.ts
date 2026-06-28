import type { Agent, AgentContext, AgentResult } from '../types'

const createPlaceholderAgent = (name: string): Agent => ({
  name,
  run: async (context: AgentContext): Promise<AgentResult> => ({
    schedulePlan: context.schedulePlan,
    notifications: context.notifications,
    agentMessages: context.agentMessages,
    explanations: [`${name} placeholder executed.`],
    suggestedActions: [{ id: `placeholder-${name}`, label: `${name} done`, type: 'dismiss' }],
  }),
})

export const priorityAgent = createPlaceholderAgent('PriorityAgent')
export const stateAgent = createPlaceholderAgent('StateAgent')
export const scheduleAgent = createPlaceholderAgent('ScheduleAgent')
export const eventAgent = createPlaceholderAgent('EventAgent')
export const interactionAgent = createPlaceholderAgent('InteractionAgent')
export const explainAgent = createPlaceholderAgent('ExplainAgent')

export const placeholderAgents: Agent[] = [
  priorityAgent,
  stateAgent,
  scheduleAgent,
  eventAgent,
  interactionAgent,
  explainAgent,
]
