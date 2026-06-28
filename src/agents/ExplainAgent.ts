import { BaseAgent } from '../core/BaseAgent'
import { generateMorningBrief } from '../modules/morningBrief'
import type {
  AgentContext,
  AgentMessage,
  AgentResult,
  PlanningInsight,
  SuggestedAction,
} from '../types'

const formatPlanningReport = (insight: PlanningInsight): string => {
  const researchItems =
    insight.researchSummary && insight.researchSummary.length > 0
      ? insight.researchSummary.slice(0, 4).map((item) => `- ${item}`).join('\n')
      : '- 暂未拿到可靠搜索结果，第一步需要核对官方页面或邮件。'
  const taskItems = insight.taskBreakdown.map((task, index) => `${index + 1}. ${task}`).join('\n')
  const conflictItems =
    insight.conflicts.length > 0
      ? insight.conflicts.map((conflict) => `- ${conflict}`).join('\n')
      : '- 暂未发现硬冲突，但仍需要根据官方 DDL 更新计划。'
  const scheduleRows = insight.schedule
    .map(
      (item) =>
        `| ${item.date} | ${item.startTime}-${item.endTime} | ${item.title} | ${item.priority} | ${item.reason} |`,
    )
    .join('\n')
  const constraintItems =
    insight.constraints.length > 0
      ? insight.constraints.map((constraint) => `- ${constraint}`).join('\n')
      : '- 官方 DDL、材料要求、地点和长周期事项仍需确认。'

  return [
    '## 结论',
    `已把“${insight.objective}”作为整体目标处理：先搜索和确认硬约束，再拆分任务、检查冲突，最后整体排到具体日期和时间。`,
    '',
    '## 搜索依据',
    researchItems,
    '',
    '## 任务拆解',
    taskItems,
    '',
    '## 冲突检查',
    conflictItems,
    '',
    '## 具体排期',
    '| 日期 | 时间 | 任务 | 优先级 | 原因 |',
    '|---|---|---|---|---|',
    scheduleRows || '| 待确认 | 待确认 | 核对官方 DDL 后生成完整排期 | P0 | 当前缺少可靠硬约束。 |',
    '',
    '## 待确认',
    constraintItems,
  ].join('\n')
}

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
      explanations.push(
        '因为睡眠评分低于 60，系统会降低深度任务强度，避免上午过早消耗精力。',
      )
      decisionFactors.push('睡眠不足')
    }

    if (highPriorityEvents.length > 0) {
      explanations.push(
        `检测到 ${highPriorityEvents.length} 个 P0/P1 外部事件，需要预留处理窗口，避免关键事项被遗漏。`,
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

    agentMessages.push(
      context.planningInsight
        ? this.createMessage(formatPlanningReport(context.planningInsight))
        : await this.createDeepSeekMessage(
            context,
            'Explain the final multi-agent decision in plain language and answer any user command directly.',
            [
              `Decision factors: ${decisionFactors.join(', ')}`,
              'No planning insight was generated.',
              ...explanations,
            ],
          ),
    )

    return {
      morningBrief,
      explanations,
      suggestedActions,
      agentMessages,
    }
  }
}
