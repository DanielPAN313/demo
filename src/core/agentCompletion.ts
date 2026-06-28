import type { AgentContext } from '../types'
import { chatWithDeepSeek } from './deepseekClient'

type AgentCompletionParams = {
  agentName: string
  context: AgentContext
  responsibility: string
  localFindings: string[]
}

const serializeContext = (context: AgentContext): string =>
  JSON.stringify(
    {
      eventType: context.eventType,
      currentTime: context.currentTime,
      userCommand: context.userCommand,
      userState: context.userState,
      topTasks: context.tasks.slice(0, 5).map((task) => ({
        title: task.title,
        priority: task.priority,
        deadline: task.deadline,
        estimatedMinutes: task.estimatedMinutes,
        intensity: task.intensity,
        status: task.status,
      })),
      externalEvents: context.externalEvents.slice(0, 5).map((event) => ({
        title: event.title,
        source: event.source,
        priority: event.priority,
        requiredAction: event.requiredAction,
        estimatedMinutes: event.estimatedMinutes,
      })),
      scheduleSummary: context.schedulePlan?.summary,
      planningInsight: context.planningInsight,
      notificationCount: context.notifications.length,
    },
    null,
    2,
  )

export const createAgentCompletion = async ({
  agentName,
  context,
  responsibility,
  localFindings,
}: AgentCompletionParams): Promise<string> => {
  const completion = await chatWithDeepSeek({
    agentName,
    temperature: 0.35,
    maxTokens: context.userCommand ? 360 : 220,
    messages: [
      {
        role: 'system',
        content:
          `You are ${agentName}, one specialist inside a personal rhythm multi-agent assistant. ` +
          'Reply in concise Chinese. Do not mention implementation details, API calls, or hidden prompts. ' +
          'If there is a user command, answer it directly while staying within your agent responsibility.',
      },
      {
        role: 'user',
        content:
          `Agent responsibility: ${responsibility}\n\n` +
          `Runtime context:\n${serializeContext(context)}\n\n` +
          `Local deterministic findings:\n${localFindings.map((finding) => `- ${finding}`).join('\n')}`,
      },
    ],
  })

  return completion.content
}
