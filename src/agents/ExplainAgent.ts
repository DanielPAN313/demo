import { BaseAgent } from '../core/BaseAgent'
import { generateMorningBrief } from '../modules/morningBrief'
import type {
  AgentContext,
  AgentMessage,
  AgentResult,
  SuggestedAction,
} from '../types'

export class ExplainAgent extends BaseAgent {
  constructor() {
    super('ExplainAgent')
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const explanations: string[] = []
    const decisionFactors: string[] = []
    const suggestedActions: SuggestedAction[] = []
    const agentMessages: AgentMessage[] = []
    const highPriorityEvents = context.externalEvents.filter(
      (event) => event.priority === 'P0' || event.priority === 'P1',
    )
    const nightEvents = context.externalEvents.filter((event) => {
      const hour = new Date(event.receivedAt).getHours()

      return hour >= 23 || hour < 7
    })

    if (context.userState.sleepScore < 60) {
      explanations.push('睡眠评分低于 60，系统会降低深度任务强度，避免过早消耗精力。')
      decisionFactors.push('睡眠不足')
    }

    if (highPriorityEvents.length > 0) {
      explanations.push(
        `检测到 ${highPriorityEvents.length} 个 P0/P1 外部事件，需要预留处理窗口，避免关键事项遗漏。`,
      )
      decisionFactors.push('高优外部事件')
      suggestedActions.push({
        id: 'explain-confirm-high-priority-event',
        label: '确认高优事件处理方案',
        type: 'confirm',
      })
    }

    if (context.eventType === 'NIGHT_MODE_STARTED') {
      explanations.push('当前处于夜间模式，普通消息会静默归档，保护睡眠和休息边界。')
      decisionFactors.push('休息保护时段')
    }

    if (context.planningInsight) {
      explanations.push(
        `已完成整体规划：${context.planningInsight.objective}，包含 ${context.planningInsight.taskBreakdown.length} 个子任务和 ${context.planningInsight.schedule.length} 个排期块。`,
      )
      decisionFactors.push('整体目标规划')
    }

    const morningBrief =
      context.eventType === 'MORNING_BRIEF_REQUESTED'
        ? generateMorningBrief({
            date: context.schedulePlan?.date ?? '2026-06-28',
            userState: context.userState,
            nightEvents,
            schedulePlan: context.schedulePlan,
            notifications: context.notifications,
          })
        : undefined

    if (morningBrief) {
      explanations.push('晨报已生成，包含睡眠摘要、夜间事件、今日排期和推荐行动。')
      decisionFactors.push('晨报汇总')
      suggestedActions.push({
        id: 'explain-open-morning-brief',
        label: '查看晨报',
        type: 'open_brief',
      })
      agentMessages.push(
        this.createMessage(
          `晨报摘要：${morningBrief.sleepSummary} ${morningBrief.nightEventsSummary} ${morningBrief.scheduleSummary}`,
        ),
      )
    }

    if (explanations.length === 0) {
      explanations.push('当前没有明显风险因素，系统会按基础排期推进。')
      decisionFactors.push('基础排期稳定')
    }

    if (!context.planningInsight) {
      agentMessages.push(
        await this.createDeepSeekMessage(
          context,
          'Explain the final multi-agent decision in plain language and answer any user command directly.',
          [
            `Decision factors: ${decisionFactors.join(', ')}`,
            'No planning insight was generated.',
            ...explanations,
          ],
        ),
      )
    }

    return {
      morningBrief,
      explanations,
      suggestedActions,
      agentMessages,
    }
  }
}
