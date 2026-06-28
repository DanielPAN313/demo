import { createAgentCompletion } from './agentCompletion'
import type { Agent, AgentContext, AgentMessage, AgentRunResult } from '../types'

export abstract class BaseAgent implements Agent {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  protected createMessage(content: string): AgentMessage {
    return {
      id: `${this.name}-${Date.now()}`,
      role: 'agent',
      content,
      createdAt: new Date().toISOString(),
    }
  }

  protected async createDeepSeekMessage(
    context: AgentContext,
    responsibility: string,
    localFindings: string[],
  ): Promise<AgentMessage> {
    const content = await createAgentCompletion({
      agentName: this.name,
      context,
      responsibility,
      localFindings,
    })

    return this.createMessage(content)
  }

  abstract run(context: AgentContext): AgentRunResult
}

