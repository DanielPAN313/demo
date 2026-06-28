export type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type DeepSeekChatRequest = {
  agentName: string
  messages: DeepSeekMessage[]
  temperature?: number
  maxTokens?: number
}

export type DeepSeekChatResponse = {
  agentName?: string
  content: string
  model?: string
  usage?: unknown
}

export const chatWithDeepSeek = async (
  request: DeepSeekChatRequest,
): Promise<DeepSeekChatResponse> => {
  const response = await fetch('/api/deepseek/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = (await response.json()) as DeepSeekChatResponse & {
    error?: string
    detail?: string
  }

  if (!response.ok) {
    throw new Error(data.detail ?? data.error ?? 'DeepSeek request failed')
  }

  return data
}
