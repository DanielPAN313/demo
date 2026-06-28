import type { AgentContext, AgentResult, SuggestedAction } from '../types'

export type AgentApiConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

type ChatCompletionMessage = {
  role: 'system' | 'user'
  content: string
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const env = import.meta.env
const AGENT_API_TIMEOUT_MS = 30000

export const getAgentApiConfig = (): AgentApiConfig | undefined => {
  const baseUrl = env.VITE_AGENT_API_BASE_URL?.trim()
  const apiKey = env.VITE_AGENT_API_KEY?.trim()
  const model = env.VITE_AGENT_MODEL?.trim()

  if (!baseUrl || !apiKey || !model) return undefined

  return { baseUrl, apiKey, model }
}

export const extractJsonObject = (content: string): string => {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fencedMatch?.[1]?.trim() ?? content.trim()
  const firstBrace = candidate.indexOf('{')
  const lastBrace = candidate.lastIndexOf('}')

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1)
  }

  return candidate
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toExplanation = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

const normalizeSuggestedActions = (
  value: unknown,
  agentName: string,
): SuggestedAction[] | undefined => {
  if (!Array.isArray(value)) return undefined

  const seenIds = new Map<string, number>()

  return value
    .filter(isRecord)
    .map((action, index) => {
      const rawId = typeof action.id === 'string' ? action.id : `${agentName}-action-${index}`
      const seenCount = seenIds.get(rawId) ?? 0
      seenIds.set(rawId, seenCount + 1)
      const normalizedAction: SuggestedAction = {
        id: seenCount === 0 ? rawId : `${rawId}-${seenCount + 1}`,
        label: typeof action.label === 'string' ? action.label : '查看建议',
        type:
          action.type === 'reschedule' ||
          action.type === 'confirm' ||
          action.type === 'dismiss' ||
          action.type === 'open_brief' ||
          action.type === 'start_focus'
            ? action.type
            : 'confirm',
      }

      if (isRecord(action.payload)) {
        normalizedAction.payload = action.payload
      }

      return normalizedAction
    })
}

const normalizeAgentResult = (result: AgentResult, agentName: string): AgentResult => ({
  ...result,
  explanations: Array.isArray(result.explanations)
    ? result.explanations.map(toExplanation)
    : undefined,
  suggestedActions: normalizeSuggestedActions(result.suggestedActions, agentName),
})

const getAgentPayload = (agentName: string, context: AgentContext): unknown => {
  const base = {
    currentTime: context.currentTime,
    eventType: context.eventType,
    userCommand: context.userCommand,
  }

  switch (agentName) {
    case 'PriorityAgent':
      return { ...base, tasks: context.tasks }
    case 'StateAgent':
      return {
        ...base,
        userState: context.userState,
        highPriorityEvents: context.externalEvents.filter(
          (event) => event.priority === 'P0' || event.priority === 'P1',
        ),
      }
    case 'ScheduleAgent':
      return {
        ...base,
        fixedSchedules: context.fixedSchedules,
        tasks: context.tasks,
        userState: context.userState,
        externalEvents: context.externalEvents.filter((event) => event.requiredAction),
      }
    case 'EventAgent':
      return { ...base, externalEvents: context.externalEvents, tasks: context.tasks }
    case 'InteractionAgent':
      return {
        ...base,
        externalEvents: context.externalEvents,
        userState: context.userState,
      }
    case 'ExplainAgent':
      return {
        ...base,
        userState: context.userState,
        highPriorityEvents: context.externalEvents.filter(
          (event) => event.priority === 'P0' || event.priority === 'P1',
        ),
        scheduleSummary: context.schedulePlan?.summary,
        notifications: context.notifications,
      }
    default:
      return context
  }
}

export const parseAgentApiResult = (
  content: string,
  agentName = 'Agent',
): AgentResult => {
  try {
    const parsed: unknown = JSON.parse(extractJsonObject(content))

    if (!isRecord(parsed)) {
      return { explanations: [content] }
    }

    return normalizeAgentResult(parsed as AgentResult, agentName)
  } catch {
    return { explanations: [content] }
  }
}

export const runAgentApi = async (
  agentName: string,
  systemPrompt: string,
  context: AgentContext,
  fallback: AgentResult,
): Promise<AgentResult> => {
  const config = getAgentApiConfig()

  if (!config) {
    return {
      ...fallback,
      agentMessages: [
        ...(fallback.agentMessages ?? []),
        {
          id: `${agentName}-api-missing-${Date.now()}`,
          role: 'agent',
          content: `${agentName} 未配置 API，已使用本地规则 fallback。`,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  }

  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  const messages: ChatCompletionMessage[] = [
    {
      role: 'system',
      content: [
        systemPrompt,
        '你是 24h 个人节律调度 demo 的一个子 Agent。',
        '必须只返回一个 JSON object，不要 Markdown，不要解释 JSON 之外的文字。',
        'JSON 必须符合 AgentResult 形状，可包含 schedulePlan、notifications、morningBrief、explanations、suggestedActions、agentMessages。',
        '如果某个字段不需要改变，就不要返回该字段。',
        'suggestedActions.type 只能是 reschedule、confirm、dismiss、open_brief、start_focus。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          agentName,
          context: getAgentPayload(agentName, context),
          localFallbackAvailable: true,
        },
        null,
        2,
      ),
    },
  ]

  try {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), AGENT_API_TIMEOUT_MS)
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        max_tokens: 1200,
      }),
    })
    window.clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`)
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('API returned an empty message')
    }

    const result = parseAgentApiResult(content, agentName)

    return {
      ...fallback,
      ...result,
      explanations: result.explanations ?? fallback.explanations,
      suggestedActions: result.suggestedActions ?? fallback.suggestedActions,
      agentMessages: [
        ...(fallback.agentMessages ?? []),
        ...(result.agentMessages ?? []),
      ],
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? `请求超过 ${AGENT_API_TIMEOUT_MS / 1000} 秒`
        : error instanceof Error
          ? error.message
          : 'Unknown API error'

    return {
      ...fallback,
      explanations: [
        ...(fallback.explanations ?? []),
        `${agentName} API 调用失败，已使用本地规则 fallback：${message}`,
      ],
    }
  }
}
