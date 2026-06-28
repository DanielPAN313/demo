import type { AgentResult } from '../types'
import { chatWithDeepSeek } from './deepseekClient'
import { createDefaultOrchestrator } from './AgentOrchestrator'
import { createAgentContext } from './createAgentContext'
import type { AgentRuntimeEvent } from './agentEvents'

const planningKeywords = [
  '安排',
  '规划',
  '排期',
  '日程',
  '任务',
  '会议',
  '中稿',
  '参加',
  'deadline',
  'ddl',
  'visa',
  'poster',
  'github',
  'issue',
  'pr',
]

const shouldUseFullPipeline = (event?: AgentRuntimeEvent): boolean => {
  if (event?.type !== 'USER_COMMAND') return true

  const command = event.payload?.command?.toLowerCase().trim()

  if (!command) return true

  return planningKeywords.some((keyword) => command.includes(keyword))
}

const runDirectChat = async (event: AgentRuntimeEvent): Promise<AgentResult> => {
  const command = event.payload?.command ?? ''
  const completion = await chatWithDeepSeek({
    agentName: 'ChatAgent',
    temperature: 0.45,
    maxTokens: 260,
    messages: [
      {
        role: 'system',
        content:
          '你是一个自然、简洁的中文助手。直接回答用户当前这句话。不要套固定格式，不要主动输出日程、优先级或任务建议，除非用户明确要求规划。',
      },
      {
        role: 'user',
        content: command,
      },
    ],
  })

  return {
    explanations: [],
    suggestedActions: [],
    agentMessages: [
      {
        id: `direct-chat-${Date.now()}`,
        role: 'agent',
        content: completion.content,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export const runAgentPipeline = async (event?: AgentRuntimeEvent): Promise<AgentResult> => {
  if (event && !shouldUseFullPipeline(event)) {
    return runDirectChat(event)
  }

  const context = createAgentContext(event)
  const orchestrator = createDefaultOrchestrator()

  return orchestrator.run(context)
}

