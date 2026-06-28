import type {
  AgentEventType,
  ExternalEvent,
  NotificationChannel,
  NotificationItem,
  UserState,
} from '../types'

export type NotificationEngineParams = {
  currentTime: string
  eventType: AgentEventType
  userState: UserState
}

const isHighLoad = (userState: UserState): boolean =>
  userState.fatigueLevel === 'high' || userState.stressLevel === 'high'

export const classifyNotification = (
  event: ExternalEvent,
  params: NotificationEngineParams,
): NotificationChannel => {
  if (params.eventType === 'NIGHT_MODE_STARTED') {
    if (event.priority === 'P0') return 'immediate'
    if (event.priority === 'P1') return 'digest'

    return 'silent'
  }

  if (event.priority === 'P0') return 'immediate'

  if (event.priority === 'P1' && event.requiredAction) {
    return isHighLoad(params.userState) ? 'defer' : 'immediate'
  }

  if (event.source === 'course' || event.source === 'calendar') {
    return 'digest'
  }

  if (event.source === 'message') {
    return 'defer'
  }

  if (event.source === 'github' && (event.priority === 'P2' || event.priority === 'P3')) {
    return 'silent'
  }

  return isHighLoad(params.userState) ? 'digest' : 'defer'
}

export const getNotificationReason = (
  event: ExternalEvent,
  channel: NotificationChannel,
  params: NotificationEngineParams,
): string => {
  if (params.eventType === 'NIGHT_MODE_STARTED') {
    if (channel === 'immediate') {
      return '夜间模式下仍是 P0 最高优先级事件，需要立即提醒。'
    }

    if (channel === 'digest') {
      return '夜间模式下 P1 事件保留到晨报汇总，避免直接打断休息。'
    }

    return '夜间模式下普通事件静默归档，保护睡眠和休息边界。'
  }

  if (channel === 'immediate') {
    return `该事件优先级为 ${event.priority} 且需要行动，当前应立即提醒。`
  }

  if (channel === 'defer') {
    return isHighLoad(params.userState)
      ? '当前疲劳或压力较高，避免直接打断，延后到合适窗口提醒。'
      : '该事件不需要立刻打断，适合稍后集中处理。'
  }

  if (channel === 'digest') {
    return event.source === 'course' || event.source === 'calendar'
      ? '课程或日历事件需要纳入计划，但适合汇总后展示。'
      : '当前状态负荷较高，该事件先进入汇总，减少打扰。'
  }

  if (event.source === 'github') {
    return '低优先级 GitHub 更新不需要主动打扰，先静默归档。'
  }

  return '该事件优先级较低，先静默归档，等待用户主动查看。'
}

export const generateNotifications = (
  events: ExternalEvent[],
  params: NotificationEngineParams,
): NotificationItem[] =>
  events.map((event) => {
    const channel = classifyNotification(event, params)

    return {
      id: `notification-${event.id}`,
      title: event.title,
      channel,
      sourceEventId: event.id,
      reason: getNotificationReason(event, channel, params),
      createdAt: new Date().toISOString(),
    }
  })
