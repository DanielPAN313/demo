import {
  baseEvents,
  fixedSchedules,
  githubP1Event,
  nightEvents,
  tasks,
  userStates,
} from '../data/mockData'
import type {
  AgentContext,
  AgentResult,
  DemoScenario,
  ExternalEvent,
  NotificationBucket,
  NotificationItem,
  ScheduleBlock,
  ScheduleType,
} from '../types'

const basePlan: ScheduleBlock[] = [
  block('sleep', '睡眠', '00:00', '07:20', 'fixed', 'sleep', '恢复基础精力'),
  block('breakfast', '早餐', '07:40', '08:10', 'fixed', 'breakfast', '固定补能窗口'),
  block('commute', '通勤', '08:15', '08:50', 'fixed', 'commute', '固定移动时间'),
  block('focus-1', '深度开发 Agent 调度器', '09:00', '10:25', 'focus', 'deep-dev', '上午专注容量高，优先安排 P1 开发任务', 'P1'),
  block('class', '系统设计课', '10:30', '12:00', 'fixed', 'class', '固定课程不可移动'),
  block('lunch', '午餐', '12:10', '13:00', 'fixed', 'lunch', '固定补能窗口'),
  block('focus-2', '深度开发收尾', '13:30', '14:25', 'focus', 'deep-dev', '延续高优先级任务，形成完整交付'),
  block('review', '课程复习', '14:40', '15:25', 'micro', 'review', '中等强度任务放在午后恢复段', 'P2'),
  block('retro', '项目复盘', '15:40', '16:15', 'micro', 'retro', '复盘任务适合短窗口完成', 'P2'),
  block('docs', '路演文档整理', '16:20', '17:10', 'micro', 'docs', '排在运动前，避免压到晚间休息', 'P2'),
  block('exercise', '拉伸恢复', '17:30', '18:00', 'fixed', 'exercise', '固定恢复锚点'),
  block('messages', '协作消息回复', '19:20', '19:45', 'micro', 'messages', '低优先级沟通集中处理，减少白天打断', 'P3'),
  block('evening', '晚间休息', '22:20', '23:20', 'fixed', 'evening', '进入低刺激恢复时段'),
]

const plans: Record<DemoScenario, ScheduleBlock[]> = {
  normal: basePlan,
  sleepPoor: [
    ...basePlan.slice(0, 3),
    block('recovery-am', '恢复窗口', '09:00', '09:25', 'rest', 'state', '睡眠评分偏低，先降低进入深度工作的坡度'),
    block('focus-soft', '深度开发轻量推进', '09:35', '10:25', 'focus', 'deep-dev', '上午深度任务缩短 30%，保留核心推进', 'P1'),
    ...basePlan.slice(4, 6),
    block('rest-mid', '午后恢复', '13:20', '13:45', 'rest', 'state', '疲劳水平较高，插入恢复缓冲'),
    block('focus-pm', '深度开发收尾', '14:00', '14:55', 'focus', 'deep-dev', '把剩余高强度任务移到午后较稳定窗口', 'P1'),
    block('review-soft', '课程复习', '15:15', '15:55', 'micro', 'review', '中等强度任务保留，但缩短连续工作时长', 'P2'),
    block('docs-late', '路演文档整理', '20:00', '20:40', 'micro', 'docs', '低风险任务后移，避免挤压恢复'),
    ...basePlan.slice(10),
  ],
  stressHigh: [
    ...basePlan.slice(0, 3),
    block('focus-calm', '深度开发 Agent 调度器', '09:00', '10:15', 'focus', 'deep-dev', '压力较高，保留单一主线任务，减少切换', 'P1'),
    ...basePlan.slice(4, 6),
    block('admin-buffer', '低刺激整理', '13:30', '14:05', 'micro', 'docs', '用低切换任务替代密集沟通', 'P2'),
    block('review-calm', '课程复习', '14:20', '15:05', 'micro', 'review', '压力高时安排明确边界的复习任务', 'P2'),
    block('reset', '压力卸载窗口', '15:20', '15:45', 'rest', 'state', '插入短恢复，降低下午沟通成本'),
    block('messages-late', '协作消息回复', '19:30', '19:55', 'micro', 'messages', '沟通任务集中到晚些时候处理', 'P3'),
    ...basePlan.slice(10),
  ],
  githubP1: [
    ...basePlan.slice(0, 6),
    block('incident', 'GitHub P1 最小处理', '13:45', '14:10', 'event', 'github-p1', 'P1 事件需要响应，但只给最小处理窗口', 'P1'),
    block('focus-replan', '深度开发收尾', '14:20', '15:05', 'focus', 'deep-dev', '高优先级主线后移，避免完全中断', 'P1'),
    block('review-replan', '课程复习', '15:20', '16:00', 'micro', 'review', 'P2 任务让位给突发事件'),
    block('docs-replan', '路演文档整理', '20:00', '20:45', 'micro', 'docs', '文档任务被后移到晚间低打扰窗口', 'P2'),
    ...basePlan.slice(10),
  ],
  nightMode: [
    ...basePlan.slice(0, 10),
    block('quiet', '夜间静默', '21:30', '22:20', 'rest', 'night', '普通消息进入静默分桶，只保留最高优先级打扰'),
    ...basePlan.slice(12),
  ],
  morningBrief: [
    block('sleep', '睡眠', '00:00', '07:20', 'fixed', 'sleep', '夜间普通事件已收纳到晨报'),
    block('brief', '晨报确认', '07:25', '07:40', 'event', 'brief', '汇总夜间事件、睡眠状态和今日调整项'),
    ...basePlan.slice(1, 6),
    block('focus-after-brief', '深度开发 Agent 调度器', '13:30', '14:30', 'focus', 'deep-dev', '晨报确认后保留一个完整开发窗口', 'P1'),
    block('team-sync', 'Demo 顺序确认', '14:45', '15:00', 'micro', 'night-chat', '夜间队友留言被安排到白天处理', 'P2'),
    ...basePlan.slice(8),
  ],
}

export function runAgentOrchestrator(scenario: DemoScenario): AgentResult {
  const externalEvents = getEvents(scenario)
  const context: AgentContext = {
    fixedSchedules,
    tasks,
    userState: userStates[scenario],
    externalEvents,
    currentTime: getCurrentTime(scenario),
    schedulePlan: plans[scenario],
  }

  return {
    updatedSchedule: context.schedulePlan,
    notifications: classifyNotifications(externalEvents, scenario),
    explanations: getExplanations(scenario),
    suggestedActions: getSuggestedActions(scenario),
    agentMessages: getAgentMessages(scenario),
    morningBrief: getMorningBrief(scenario),
    stateLabel: getStateLabel(context),
  }
}

function getEvents(scenario: DemoScenario): ExternalEvent[] {
  if (scenario === 'githubP1') return [...baseEvents, githubP1Event]
  if (scenario === 'nightMode' || scenario === 'morningBrief') {
    return [...baseEvents, ...nightEvents]
  }
  return baseEvents
}

function classifyNotifications(
  events: ExternalEvent[],
  scenario: DemoScenario,
): NotificationItem[] {
  return events.map((event) => {
    const bucket = getBucket(event, scenario)
    return {
      id: event.id,
      title: event.title,
      bucket,
      source: event.source,
      priority: event.priority,
      reason: getNotificationReason(event, bucket, scenario),
    }
  })
}

function getBucket(
  event: ExternalEvent,
  scenario: DemoScenario,
): NotificationBucket {
  if (scenario === 'nightMode') {
    return event.priority === 'P0' ? 'immediate' : 'silent'
  }

  if (scenario === 'morningBrief') {
    return event.receivedAt.startsWith('0') ? 'morning' : 'later'
  }

  if (event.priority === 'P1' && event.interruptLevel >= 7) return 'later'
  if (event.priority === 'P2') return 'morning'
  return 'silent'
}

function getNotificationReason(
  event: ExternalEvent,
  bucket: NotificationBucket,
  scenario: DemoScenario,
) {
  if (scenario === 'nightMode' && bucket === 'silent') {
    return '夜间静默开启，非最高优先级消息不打扰'
  }
  if (bucket === 'later' && event.priority === 'P1') {
    return '优先级高，但系统给出最小处理窗口，避免完全打断'
  }
  if (bucket === 'morning') return '适合进入晨报汇总'
  return '低打扰价值，静默归档'
}

function getExplanations(scenario: DemoScenario) {
  const map: Record<DemoScenario, string[]> = {
    normal: [
      'PriorityAgent 将 P1 深度开发放在上午高专注窗口。',
      'ScheduleAgent 保留课程、午餐、运动等固定锚点。',
      'InteractionAgent 把普通消息集中到晚间处理。',
    ],
    sleepPoor: [
      'StateAgent 检测到睡眠评分 48，上午深度任务减少约 30%。',
      'ScheduleAgent 插入两个恢复窗口，避免连续高强度工作。',
      'ExplainAgent 将低风险文档任务后移到晚间。',
    ],
    stressHigh: [
      'StateAgent 识别压力较高，减少沟通和上下文切换。',
      'ScheduleAgent 保留单一主线任务，并插入压力卸载窗口。',
      'InteractionAgent 将协作消息推迟到晚间集中处理。',
    ],
    githubP1: [
      'EventAgent 判断 GitHub P1 需要响应，但不直接吞掉下午。',
      'ScheduleAgent 安排 25 分钟最小处理窗口。',
      'ExplainAgent 将 P2 文档任务后移，并保留 P1 开发主线。',
    ],
    nightMode: [
      'InteractionAgent 进入夜间静默策略。',
      '普通协作消息、系统更新进入静默归档。',
      '只有 P0 级紧急事件会立即打扰。',
    ],
    morningBrief: [
      'MorningBrief 汇总夜间消息和今日任务。',
      'ScheduleAgent 安排 15 分钟晨报确认窗口。',
      '夜间队友留言被移动到白天短沟通窗口。',
    ],
  }

  return map[scenario]
}

function getSuggestedActions(scenario: DemoScenario) {
  const map: Record<DemoScenario, string[]> = {
    normal: ['保持上午主线开发', '晚间集中处理消息', '路演文档 16:20 前完成初稿'],
    sleepPoor: ['先做 25 分钟恢复', '只推进开发核心链路', '减少临时沟通'],
    stressHigh: ['关闭非必要提醒', '保持单任务推进', '把协作沟通放到固定窗口'],
    githubP1: ['先处理 P1 最小修复', '记录后续排查', '将文档整理后移'],
    nightMode: ['静默普通通知', '保留 P0 紧急通道', '明早统一生成晨报'],
    morningBrief: ['确认夜间留言', '锁定今日主线任务', '把低优先级消息归档'],
  }

  return map[scenario]
}

function getAgentMessages(scenario: DemoScenario) {
  const text: Record<DemoScenario, string> = {
    normal: '今天适合先打通 Agent 调度闭环，上午放深度开发，下午补复习和路演材料。',
    sleepPoor: '检测到睡眠不足。我已降低上午深度任务密度，并插入恢复窗口。',
    stressHigh: '压力水平偏高。我会减少切换，把沟通任务集中到晚间处理。',
    githubP1: 'GitHub P1 已进入排期。我没有直接打断整段下午，而是安排了 25 分钟最小处理窗口。',
    nightMode: '夜间静默已开启。普通消息会被收纳，明早统一进入晨报。',
    morningBrief: '晨报已生成。夜间事件已分流，今日主线仍然保留给 Agent 调度器。',
  }

  return [
    {
      agent: getAgentName(scenario),
      text: text[scenario],
    },
  ]
}

function getMorningBrief(scenario: DemoScenario) {
  if (scenario !== 'morningBrief') return []

  return [
    '夜间收到 2 条事件：依赖更新、队友留言。',
    '睡眠评分 61，上午保留轻量确认，深度开发移到午后。',
    '今日需要确认 Demo 讲述顺序，并继续推进 Agent 调度器。',
  ]
}

function getStateLabel(context: AgentContext) {
  const { sleepScore, stressLevel, fatigueLevel } = context.userState
  if (sleepScore < 60) return '睡眠不足'
  if (stressLevel > 75) return '高压状态'
  if (fatigueLevel > 65) return '疲劳偏高'
  return '状态稳定'
}

function getCurrentTime(scenario: DemoScenario) {
  if (scenario === 'nightMode') return '22:05'
  if (scenario === 'morningBrief') return '07:30'
  if (scenario === 'githubP1') return '13:45'
  return '09:00'
}

function getAgentName(scenario: DemoScenario) {
  if (scenario === 'githubP1') return 'EventAgent'
  if (scenario === 'nightMode') return 'InteractionAgent'
  if (scenario === 'morningBrief') return 'MorningBrief'
  if (scenario === 'sleepPoor' || scenario === 'stressHigh') return 'StateAgent'
  return 'AgentOrchestrator'
}

function block(
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  type: ScheduleType,
  sourceId: string,
  reason: string,
  priority?: ScheduleBlock['priority'],
): ScheduleBlock {
  return {
    id,
    title,
    startTime,
    endTime,
    type,
    sourceId,
    priority,
    reason,
  }
}
