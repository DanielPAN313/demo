import { BaseAgent } from '../core/BaseAgent'
import { generateSchedulePlan } from '../modules/scheduleEngine'
import type { AgentContext, AgentResult } from '../types'

const DEMO_DATE = '2026-06-28'

export class ScheduleAgent extends BaseAgent {
  constructor() {
    super('ScheduleAgent')
  }

  run(context: AgentContext): AgentResult {
    const schedulePlan = generateSchedulePlan({
      date: DEMO_DATE,
      fixedSchedules: context.fixedSchedules,
      tasks: context.tasks,
      userState: context.userState,
    })
    const adjustedBlocks = schedulePlan.blocks.filter((block) => block.isAdjusted)

    return {
      schedulePlan,
      explanations: [
        'ScheduleAgent 已使用 scheduleEngine 重新生成今日排期。',
        schedulePlan.summary,
        adjustedBlocks.length > 0
          ? `本次有 ${adjustedBlocks.length} 个时间块带有状态调整标记。`
          : '本次没有明显的状态调整块。',
      ],
      agentMessages: [
        this.createMessage(
          `ScheduleAgent 已运行。我已调用排期引擎生成 ${DEMO_DATE} 的计划，共 ${schedulePlan.blocks.length} 个时间块。`,
        ),
      ],
    }
  }
}
