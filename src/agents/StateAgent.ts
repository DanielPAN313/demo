import { BaseAgent } from '../core/BaseAgent'
import type { AgentContext, AgentResult, SuggestedAction } from '../types'

export class StateAgent extends BaseAgent {
  constructor() {
    super('StateAgent')
  }

  async run(context: AgentContext): Promise<AgentResult> {
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
        await this.createDeepSeekMessage(
          context,
          'Interpret the user state and decide how fatigue, sleep, stress, and energy should affect the plan.',
          explanations,
        ),
      ],
    }
  }
}
