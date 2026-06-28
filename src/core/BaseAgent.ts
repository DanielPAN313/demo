import type { Agent, AgentContext, AgentMessage, AgentResult } from '../types'

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

  abstract run(context: AgentContext): AgentResult
}

