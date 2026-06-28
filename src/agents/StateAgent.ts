import { BaseAgent } from '../core/BaseAgent'
import { runAgentApi } from '../services/agentApi'
import type { AgentContext, AgentResult, SuggestedAction } from '../types'

export class StateAgent extends BaseAgent {
  constructor() {
    super('StateAgent')
  }

  private buildLocalResult(context: AgentContext): AgentResult {
    const { userState } = context
    const explanations: string[] = []
    const suggestedActions: SuggestedAction[] = []

    if (userState.sleepScore < 60) {
      explanations.push('睡眠不足：上午深度任务减少 30%，增加恢复窗口。')
      suggestedActions.push({
        id: 'state-reschedule-sleep',
        label: '根据睡眠状态重排上午任务',
        type: 'reschedule',
      })
    }

    if (userState.fatigueLevel === 'high') {
      explanations.push('高疲劳：避免连续长时间专注，建议拆分任务并插入短休息。')
      suggestedActions.push({
        id: 'state-reschedule-fatigue',
        label: '插入恢复窗口',
        type: 'reschedule',
      })
    }

    if (userState.stressLevel === 'high') {
      explanations.push('高压力：减少强沟通任务，优先保留关键事项。')
    }

    if (userState.energyLevel === 'low') {
      explanations.push('低能量：降低任务密度，优先安排低摩擦启动任务。')
    }

    if (explanations.length === 0) {
      explanations.push('状态良好：优先推进高价值任务。')
      suggestedActions.push({
        id: 'state-start-focus',
        label: '开始高价值专注任务',
        type: 'start_focus',
      })
    }

    return {
      explanations,
      suggestedActions,
      agentMessages: [
        this.createMessage(
          `StateAgent 已运行。检测到睡眠评分为 ${userState.sleepScore}，${
            userState.sleepScore < 60
              ? '今天上午会降低深度任务密度。'
              : '当前状态可以按计划推进重点任务。'
          }`,
        ),
      ],
    }
  }

  async run(context: AgentContext): Promise<AgentResult> {
    return runAgentApi(
      this.name,
      '你负责分析 userState，包括睡眠、疲劳、压力、情绪、能量和专注容量。输出状态解释、风险因素和建议动作，不要生成完整排期。',
      context,
      this.buildLocalResult(context),
    )
  }
}
