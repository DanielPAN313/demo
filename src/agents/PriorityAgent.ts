import { BaseAgent } from '../core/BaseAgent'
import type { AgentContext, AgentResult, Priority, Task } from '../types'

const priorityScore: Record<Priority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
}

const getDeadlineTime = (task: Task): number => {
  if (!task.deadline) return Number.POSITIVE_INFINITY

  const normalizedDeadline = task.deadline.includes('T')
    ? task.deadline
    : task.deadline.replace(' ', 'T')
  const time = new Date(normalizedDeadline).getTime()

  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

const sortTasksByPriority = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    const priorityDiff = priorityScore[a.priority] - priorityScore[b.priority]

    if (priorityDiff !== 0) return priorityDiff

    return getDeadlineTime(a) - getDeadlineTime(b)
  })

export class PriorityAgent extends BaseAgent {
  constructor() {
    super('PriorityAgent')
  }

  run(context: AgentContext): AgentResult {
    const topTasks = sortTasksByPriority(context.tasks).slice(0, 3)
    const taskSummary =
      topTasks.length > 0
        ? topTasks.map((task) => task.title).join('、')
        : '暂无待处理任务'

    return {
      explanations: topTasks.map(
        (task, index) =>
          `优先级第 ${index + 1}：${task.title}，优先级 ${task.priority}${
            task.deadline ? `，截止时间 ${task.deadline}` : ''
          }。`,
      ),
      agentMessages: [
        this.createMessage(
          `PriorityAgent 已运行。我已根据优先级和截止时间识别出 ${topTasks.length} 个高优任务：${taskSummary}。`,
        ),
      ],
    }
  }
}
