import type { ExternalEvent, NotificationItem, SchedulePlan, UserState } from '../types'

export type MorningBrief = {
  title: string
  date: string
  sleepSummary: string
  nightEventsSummary: string
  scheduleSummary: string
  attentionSummary: string
  recommendedActions: string[]
  generatedAt: string
}

export type GenerateMorningBriefParams = {
  date: string
  userState: UserState
  nightEvents: ExternalEvent[]
  schedulePlan?: SchedulePlan
  notifications?: NotificationItem[]
}

const getSleepSummary = (userState: UserState): string => {
  if (userState.sleepScore < 60) {
    return '昨晚睡眠偏低，今天上午将降低深度任务密度。'
  }

  if (userState.sleepScore >= 80) {
    return '睡眠状态良好，适合推进高价值任务。'
  }

  return '睡眠状态中等，今天会保持正常节奏并预留恢复空间。'
}

const getNightEventsSummary = (nightEvents: ExternalEvent[]): string => {
  const highPriorityCount = nightEvents.filter(
    (event) => event.priority === 'P0' || event.priority === 'P1',
  ).length

  if (nightEvents.length === 0) {
    return '夜间没有新的外部事件，早间无需处理额外变更。'
  }

  return `夜间共收到 ${nightEvents.length} 条外部事件，其中 ${highPriorityCount} 条为高优事件。`
}

const getAttentionSummary = (notifications: NotificationItem[] = []): string => {
  if (notifications.length === 0) {
    return '暂无通知分流记录，今天将按默认注意力保护策略执行。'
  }

  const immediateCount = notifications.filter(
    (notification) => notification.channel === 'immediate',
  ).length
  const deferCount = notifications.filter((notification) => notification.channel === 'defer').length
  const digestCount = notifications.filter((notification) => notification.channel === 'digest').length
  const silentCount = notifications.filter((notification) => notification.channel === 'silent').length

  return `通知已分流：${immediateCount} 条立即提醒、${deferCount} 条稍后提醒、${digestCount} 条晨报汇总、${silentCount} 条静默归档。`
}

const getRecommendedActions = (
  userState: UserState,
  nightEvents: ExternalEvent[],
  schedulePlan?: SchedulePlan,
): string[] => {
  const actions: string[] = []
  const hasHighPriorityNightEvent = nightEvents.some(
    (event) => event.priority === 'P0' || event.priority === 'P1',
  )

  if (userState.sleepScore < 60) {
    actions.push('上午先完成 45-60 分钟关键任务，再插入短恢复窗口。')
  } else {
    actions.push('优先推进今日最高价值任务，避免被低优消息打断。')
  }

  if (hasHighPriorityNightEvent) {
    actions.push('先确认夜间高优事件是否影响今日排期。')
  } else {
    actions.push('夜间普通更新可在碎片时间统一查看。')
  }

  if (schedulePlan) {
    actions.push('按照今日排期执行，并在固定日程前预留缓冲。')
  } else {
    actions.push('先生成今日排期，再决定哪些任务需要确认。')
  }

  return actions
}

export const generateMorningBrief = ({
  date,
  userState,
  nightEvents,
  schedulePlan,
  notifications,
}: GenerateMorningBriefParams): MorningBrief => ({
  title: `${date} 晨报`,
  date,
  sleepSummary: getSleepSummary(userState),
  nightEventsSummary: getNightEventsSummary(nightEvents),
  scheduleSummary: schedulePlan?.summary ?? '今日排期尚未生成，建议先完成状态检查和任务优先级排序。',
  attentionSummary: getAttentionSummary(notifications),
  recommendedActions: getRecommendedActions(userState, nightEvents, schedulePlan),
  generatedAt: new Date().toISOString(),
})
