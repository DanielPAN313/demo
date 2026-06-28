import { BaseAgent } from '../core/BaseAgent'
import { chatWithDeepSeek } from '../core/deepseekClient'
import { searchWeb, type WebSearchResult } from '../core/webSearchClient'
import { generateSchedulePlan } from '../modules/scheduleEngine'
import type {
  AgentContext,
  AgentResult,
  PlanningInsight,
  Priority,
  ScheduleBlock,
  SchedulePlan,
  Task,
} from '../types'

const DEMO_DATE = '2026-06-28'

const priorityScore: Record<Priority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
}

const knownConferences = [
  'AAAI',
  'CVPR',
  'ICML',
  'ICLR',
  'NeurIPS',
  'ACL',
  'EMNLP',
  'KDD',
  'SIGGRAPH',
  'CHI',
]

type LlmPlanningResponse = {
  objective: string
  taskBreakdown: string[]
  constraints: string[]
  conflicts: string[]
  schedule: Array<{
    date: string
    startTime: string
    endTime: string
    title: string
    priority: Priority
    reason: string
  }>
  answer: string
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

const needsGlobalPlanning = (command?: string): command is string => {
  if (!command) return false

  return [
    '参加',
    '会议',
    'conference',
    'icml',
    'cvpr',
    'aaai',
    'neurips',
    'iclr',
    'poster',
    '签证',
    'visa',
    'ddl',
    'deadline',
    '新增',
    '突然',
    '加一条',
    '帮我安排',
    '帮我规划',
  ].some((keyword) => command.toLowerCase().includes(keyword))
}

const hasActionableGitHubEvents = (context: AgentContext): boolean =>
  context.eventType === 'EXTERNAL_EVENT_INSERTED' &&
  context.externalEvents.some(
    (event) => event.source === 'github' && event.requiredAction,
  )

const detectConference = (command: string): string | undefined => {
  const normalized = command.toLowerCase()

  return knownConferences.find((conference) => normalized.includes(conference.toLowerCase()))
}

const buildSearchQueries = (command: string): string[] => {
  const normalized = command.toLowerCase()
  const detectedConference = detectConference(command)
  const queries = detectedConference
    ? [`${detectedConference} conference accepted paper deadline camera ready registration official`]
    : [`${command.replace(/[，。！？、]/g, ' ').slice(0, 80)} deadline requirements official`]

  if (normalized.includes('icml')) {
    queries.push('ICML conference dates registration poster deadline official')
    queries.push('ICML poster presentation requirements official')
  }

  if (normalized.includes('aaai')) {
    queries.push('AAAI conference accepted paper camera-ready deadline official')
    queries.push('AAAI conference registration visa poster presentation requirements official')
  }

  if (normalized.includes('cvpr')) {
    queries.push('CVPR author kit camera ready deadline thecvf official')
    queries.push('CVPR conference registration poster presentation requirements official')
  }

  if (command.includes('签证') || normalized.includes('visa') || command.includes('韩国')) {
    queries.push('Korea visa application requirements processing time official')
  }

  return [...new Set(queries)].slice(0, 3)
}

const summarizeSearchResults = (
  query: string,
  results: WebSearchResult[],
  conference?: string,
): string[] =>
  results
    .filter((result) => {
      if (!conference) return true

      const haystack = `${result.title} ${result.snippet} ${result.url}`.toLowerCase()

      return haystack.includes(conference.toLowerCase())
    })
    .slice(0, 3)
    .map(
      (result, index) =>
        `${query} #${index + 1}: ${result.title} - ${result.snippet} (${result.url})`,
    )

const extractJsonObject = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start >= 0 && end > start) return text.slice(start, end + 1)

  return text
}

const createFallbackPlanningResponse = (
  command: string,
  researchSummary: string[],
): LlmPlanningResponse => ({
  objective: command,
  taskBreakdown: [
    '确认目标的硬性截止日期和地点要求',
    '拆分准备材料、行政手续、核心交付物和出行安排',
    '先处理长周期和不可逆任务，再安排创作与检查任务',
  ],
  constraints: [
    '需要基于搜索结果确认真实 DDL 和官方要求',
    '长周期事项需要提前启动，避免压缩到最后一周',
  ],
  conflicts: ['当前计划需要整体重排，避免新目标挤占已有 P0/P1 任务窗口'],
  schedule: [
    {
      date: '2026-06-29',
      startTime: '09:30',
      endTime: '10:30',
      title: '核对官方 deadline 和材料要求',
      priority: 'P0',
      reason: '先确定所有硬约束，避免后续排期建立在错误信息上。',
    },
    {
      date: '2026-06-29',
      startTime: '14:00',
      endTime: '16:00',
      title: '拆分交付物并完成第一版工作计划',
      priority: 'P1',
      reason: '把大目标转成可执行任务池，再整体排入后续日期。',
    },
  ],
  answer:
    `我会先把“${command}”当作一个完整目标处理。建议明天上午先花 1 小时核对官方截止日期、地点和材料要求；下午再用 2 小时把 camera-ready、注册、签证/出行、poster 或 slides、组内 rehearsal 拆成任务池。等硬性日期确认后，再把这些任务整体排到后续具体时间段里，避免和今天已有的 P0/P1 工作冲突。` +
    (researchSummary.length > 0 ? '\n\n我已经先查了一轮公开信息，但仍建议以官方页面或邮件为准。' : ''),
})

const createSchedulePlanFromInsight = (insight: PlanningInsight): SchedulePlan => ({
  date: insight.schedule[0]?.date ?? DEMO_DATE,
  horizonDays: 14,
  generatedAt: new Date().toISOString(),
  summary: `已基于“${insight.objective}”完成目标拆解、约束分析、冲突检查和多天排期。`,
  blocks: insight.schedule.map<ScheduleBlock>((item, index) => ({
    id: `planning-${index}-${item.date}-${item.startTime.replace(':', '')}`,
    title: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    type: item.priority === 'P0' || item.priority === 'P1' ? 'focus' : 'micro',
    sourceType: 'task',
    priority: item.priority,
    reason: `${item.date}：${item.reason}`,
    isAdjusted: item.priority === 'P0',
  })),
})

const createInsightFromResponse = (
  response: LlmPlanningResponse,
  researchSummary: string[],
): PlanningInsight => ({
  objective: response.objective,
  taskBreakdown: response.taskBreakdown,
  constraints: response.constraints,
  conflicts: response.conflicts,
  schedule: response.schedule,
  researchSummary,
})

export class PlanningAgent extends BaseAgent {
  constructor() {
    super('PlanningAgent')
  }

  private async runGlobalPlanning(context: AgentContext, command: string): Promise<AgentResult> {
    const searchQueries = buildSearchQueries(command)
    const detectedConference = detectConference(command)
    const searchSettled = await Promise.allSettled(
      searchQueries.map(async (query) => ({
        query,
        results: await searchWeb(query),
      })),
    )
    const researchSummary = searchSettled.flatMap((result) =>
      result.status === 'fulfilled'
        ? summarizeSearchResults(
            result.value.query,
            result.value.results,
            detectedConference,
          )
        : [`Search failed: ${result.reason instanceof Error ? result.reason.message : 'unknown error'}`],
    )
    const completion = await chatWithDeepSeek({
      agentName: this.name,
      temperature: 0.25,
      maxTokens: 1400,
      messages: [
        {
          role: 'system',
          content:
            '你是一个目标到日程的规划 agent。你必须先整体分析目标，再拆分子任务、识别依赖/DDL/冲突，最后输出具体到日期和开始结束时间的多天排期。' +
            '不要只对单条任务局部排期。新增任务也要放回全局任务池重新分析。只输出 JSON，不要在 JSON 外输出 markdown。' +
            'answer 字段用自然中文直接回答用户，不要强制套固定标题或固定表格。' +
            '简单问题就简短回答；复杂规划可以用短段落、清单或时间安排，但只展示真正有用的信息，避免堆搜索结果。',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              today: DEMO_DATE,
              currentTime: context.currentTime,
              userCommand: command,
              userState: context.userState,
              existingTasks: context.tasks,
              fixedSchedules: context.fixedSchedules,
              externalEvents: context.externalEvents,
              researchSummary,
              requiredJsonShape: {
                objective: 'string',
                taskBreakdown: ['string'],
                constraints: ['string'],
                conflicts: ['string'],
                schedule: [
                  {
                    date: 'YYYY-MM-DD',
                    startTime: 'HH:mm',
                    endTime: 'HH:mm',
                    title: 'string',
                    priority: 'P0|P1|P2|P3',
                    reason: 'string',
                  },
                ],
                answer:
                  '自然中文回复。不要固定模板；按用户问题选择短答、清单或时间安排。',
              },
            },
            null,
            2,
          ),
        },
      ],
    })
    let parsed: LlmPlanningResponse

    try {
      parsed = JSON.parse(extractJsonObject(completion.content)) as LlmPlanningResponse
    } catch {
      parsed = createFallbackPlanningResponse(command, researchSummary)
    }

    const insight = createInsightFromResponse(parsed, researchSummary)
    const schedulePlan = createSchedulePlanFromInsight(insight)

    return {
      planningInsight: insight,
      schedulePlan,
      explanations: [
        `PlanningAgent 已把“${insight.objective}”作为整体目标处理，而不是单条任务插入。`,
        `已拆分 ${insight.taskBreakdown.length} 个子任务，识别 ${insight.constraints.length} 条约束和 ${insight.conflicts.length} 个潜在冲突。`,
        `已生成 ${insight.schedule.length} 个具体排期块。`,
      ],
      agentMessages: [this.createMessage(parsed.answer)],
    }
  }

  private async runLocalPlanning(context: AgentContext): Promise<AgentResult> {
    const sortedTasks = sortTasksByPriority(context.tasks)
    const topTasks = sortedTasks.slice(0, 3)
    const schedulePlan = generateSchedulePlan({
      date: DEMO_DATE,
      fixedSchedules: context.fixedSchedules,
      tasks: sortedTasks,
      userState: context.userState,
    })
    const adjustedBlocks = schedulePlan.blocks.filter((block) => block.isAdjusted)
    const priorityFindings =
      topTasks.length > 0
        ? topTasks.map(
            (task, index) =>
              `Priority ${index + 1}: ${task.title}, ${task.priority}${
                task.deadline ? `, deadline ${task.deadline}` : ''
              }`,
          )
        : ['No pending tasks were found.']

    return {
      schedulePlan,
      explanations: [
        ...topTasks.map(
          (task, index) =>
            `优先级第 ${index + 1}：${task.title}，优先级 ${task.priority}${
              task.deadline ? `，截止时间 ${task.deadline}` : ''
            }。`,
        ),
        'PlanningAgent 已完成任务优先级判断，并使用 scheduleEngine 重新生成今日排期。',
        schedulePlan.summary,
        adjustedBlocks.length > 0
          ? `本次有 ${adjustedBlocks.length} 个时间块带有状态调整标记。`
          : '本次没有明显的状态调整块。',
      ],
      agentMessages: [
        await this.createDeepSeekMessage(
          context,
          'Prioritize today\'s tasks, place them into realistic time blocks, and explain the resulting schedule.',
          [
            ...priorityFindings,
            `Generated schedule for ${DEMO_DATE} with ${schedulePlan.blocks.length} blocks.`,
            schedulePlan.summary,
            `${adjustedBlocks.length} adjusted blocks were detected.`,
          ],
        ),
      ],
    }
  }

  private runGitHubInboxPlanning(context: AgentContext): AgentResult {
    const githubEvents = context.externalEvents
      .filter((event) => event.source === 'github' && event.requiredAction)
      .sort((a, b) => priorityScore[a.priority] - priorityScore[b.priority])
      .slice(0, 8)
    const schedule = githubEvents.map((event, index) => {
      const startHour = 10 + index
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(startHour).padStart(2, '0')}:${String(
        Math.min(event.estimatedMinutes ?? 30, 59),
      ).padStart(2, '0')}`

      return {
        date: DEMO_DATE,
        startTime,
        endTime,
        title: event.title,
        priority: event.priority,
        reason: `${event.repo ?? 'GitHub'} ${event.kind ?? 'item'}: ${event.summary}`,
      }
    })
    const insight: PlanningInsight = {
      objective: 'GitHub Inbox triage and scheduling',
      taskBreakdown: githubEvents.map(
        (event) =>
          `${event.priority} ${event.kind ?? 'GitHub item'}: ${event.title} (${event.estimatedMinutes ?? 30}m)`,
      ),
      constraints: [
        'P0/P1 GitHub items should be reviewed before lower-priority planned work.',
        'Review requests and failing CI should get short, bounded handling windows.',
      ],
      conflicts: [
        'GitHub inbox work competes with existing P1 focus tasks, so high-priority items are scheduled into bounded triage slots.',
      ],
      schedule,
      researchSummary: githubEvents.map(
        (event) =>
          `${event.repo ?? 'GitHub'} ${event.kind ?? 'item'} ${event.priority}: ${event.title}${event.url ? ` (${event.url})` : ''}`,
      ),
    }
    const schedulePlan = createSchedulePlanFromInsight(insight)

    return {
      planningInsight: insight,
      schedulePlan,
      explanations: [
        `PlanningAgent reviewed ${githubEvents.length} actionable GitHub inbox items.`,
        'GitHub inbox items were scheduled as bounded triage/review/fix windows instead of triggering web search.',
      ],
      agentMessages: [
        this.createMessage(
          `已同步 GitHub Inbox，并把 ${githubEvents.length} 个需要处理的 issue/PR/通知纳入整体排期。`,
        ),
      ],
    }
  }

  async run(context: AgentContext): Promise<AgentResult> {
    if (needsGlobalPlanning(context.userCommand)) {
      return this.runGlobalPlanning(context, context.userCommand)
    }

    if (hasActionableGitHubEvents(context)) {
      return this.runGitHubInboxPlanning(context)
    }

    return this.runLocalPlanning(context)
  }
}
