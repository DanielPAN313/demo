import { BaseAgent } from '../core/BaseAgent'
import type { AgentContext, AgentResult, ExternalEvent, Priority } from '../types'

const priorityRank: Record<Priority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
}

const byPriority = (a: ExternalEvent, b: ExternalEvent): number =>
  priorityRank[a.priority] - priorityRank[b.priority]

export class EventAgent extends BaseAgent {
  constructor() {
    super('EventAgent')
  }

  run(context: AgentContext): AgentResult {
    const sortedEvents = [...context.externalEvents].sort(byPriority)
    const highPriorityEvent = sortedEvents.find(
      (event) => (event.priority === 'P0' || event.priority === 'P1') && event.requiredAction,
    )
    const githubP1Issue = sortedEvents.find(
      (event) =>
        event.source === 'github' && event.priority === 'P1' && event.requiredAction,
    )

    if (githubP1Issue) {
      const estimatedMinutes = githubP1Issue.estimatedMinutes ?? 25

      return {
        explanations: [
          `检测到 GitHub P1 Issue，预计需要 ${estimatedMinutes} 分钟处理，建议插入最近的可用窗口。`,
        ],
        suggestedActions: [
          {
            id: `event-reschedule-${githubP1Issue.id}`,
            label: `插入 ${estimatedMinutes} 分钟最小修复窗口`,
            type: 'reschedule',
            payload: {
              eventId: githubP1Issue.id,
              estimatedMinutes,
            },
          },
        ],
        agentMessages: [
          this.createMessage(
            `EventAgent 已运行。我检测到一个高优先级外部事件：${githubP1Issue.title}，已准备交给排期模块处理。`,
          ),
        ],
      }
    }

    if (highPriorityEvent) {
      return {
        explanations: [
          `检测到高优先级外部事件：${highPriorityEvent.title}，建议纳入后续排期判断。`,
        ],
        suggestedActions: [
          {
            id: `event-review-${highPriorityEvent.id}`,
            label: '评估外部事件影响',
            type: 'confirm',
            payload: {
              eventId: highPriorityEvent.id,
            },
          },
        ],
        agentMessages: [
          this.createMessage(
            `EventAgent 已运行。我检测到一个高优先级外部事件：${highPriorityEvent.title}，已准备交给排期模块处理。`,
          ),
        ],
      }
    }

    return {
      explanations: [
        `已汇总 ${context.externalEvents.length} 个普通外部事件，当前不需要立即触发重排。`,
      ],
      agentMessages: [
        this.createMessage('EventAgent 已运行。外部事件已完成汇总，暂无必须立即处理的高优事件。'),
      ],
    }
  }
}
