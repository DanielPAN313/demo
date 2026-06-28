import type {
  FixedSchedule,
  Priority,
  ScheduleBlock,
  SchedulePlan,
  Task,
  TimeBlockType,
  UserState,
} from '../types'
import { minutesToTime, sortByStartTime, timeToMinutes } from '../utils/time'
import { buildTimeWindows } from './timeWindows'
import type { TimeWindow } from './timeWindows'

const MORNING_FOCUS_START = '09:00'
const MORNING_FOCUS_END = '12:00'
const MIN_SPLIT_MINUTES = 25
const RECOVERY_MINUTES = 15

export const getPriorityWeight = (priority: Priority): number => {
  const weights: Record<Priority, number> = {
    P0: 4,
    P1: 3,
    P2: 2,
    P3: 1,
  }

  return weights[priority]
}

const getDeadlineTime = (deadline?: string): number => {
  if (!deadline) return Number.POSITIVE_INFINITY

  const normalizedDeadline = deadline.includes('T')
    ? deadline
    : deadline.replace(' ', 'T')
  const time = new Date(normalizedDeadline).getTime()

  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

const isMorningWindow = (window: TimeWindow): boolean =>
  window.startTime >= MORNING_FOCUS_START && window.startTime < MORNING_FOCUS_END

export const sortTasksForScheduling = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)

    if (priorityDiff !== 0) return priorityDiff

    return getDeadlineTime(a.deadline) - getDeadlineTime(b.deadline)
  })

export const canTaskFitWindow = (
  task: Task,
  window: TimeWindow,
  userState: UserState,
): boolean => {
  if (window.type === 'sleep' || window.type === 'fixed') return false

  const hasEnoughTime = window.durationMinutes >= task.estimatedMinutes || task.splittable

  if (!hasEnoughTime) return false

  if (
    userState.sleepScore < 60 &&
    task.intensity === 'deep' &&
    task.estimatedMinutes > 60 &&
    isMorningWindow(window)
  ) {
    return false
  }

  if (task.intensity === 'deep') {
    return (
      window.type === 'focus' ||
      (task.priority === 'P0' && window.type === 'rest' && window.durationMinutes >= 45) ||
      (task.priority === 'P1' && window.type === 'rest' && window.durationMinutes >= 60)
    )
  }

  if (task.intensity === 'light') {
    return window.type === 'micro' || window.type === 'focus' || window.type === 'rest'
  }

  if (task.intensity === 'recovery') {
    return window.type === 'rest'
  }

  return window.type === 'focus' || window.type === 'rest' || window.type === 'micro'
}

export const getBlockTypeForTask = (
  task: Task,
  window: TimeWindow,
): TimeBlockType => {
  if (task.intensity === 'deep') return 'focus'
  if (task.intensity === 'recovery') return 'rest'
  if (task.intensity === 'light') return window.type === 'micro' ? 'micro' : window.type

  return window.type
}

type GenerateSchedulePlanParams = {
  date: string
  fixedSchedules: FixedSchedule[]
  tasks: Task[]
  userState: UserState
}

type WorkingWindow = TimeWindow & {
  cursorMinutes: number
  remainingMinutes: number
}

const fixedScheduleToBlock = (fixedSchedule: FixedSchedule): ScheduleBlock => ({
  id: `fixed-${fixedSchedule.id}`,
  title: fixedSchedule.title,
  startTime: fixedSchedule.startTime,
  endTime: fixedSchedule.endTime,
  type: fixedSchedule.type === 'sleep' ? 'sleep' : 'fixed',
  sourceType: 'fixed',
  sourceId: fixedSchedule.id,
  priority: fixedSchedule.type === 'sleep' ? 'P0' : 'P1',
  reason: `${fixedSchedule.title} 是固定日程锚点，默认不移动。`,
  isAdjusted: false,
})

const createAvailableWindow = (window: WorkingWindow): TimeWindow => ({
  id: window.id,
  startTime: minutesToTime(window.cursorMinutes),
  endTime: window.endTime,
  durationMinutes: window.remainingMinutes,
  type: window.type,
  reason: window.reason,
})

const createTaskReason = (
  task: Task,
  window: TimeWindow,
  scheduledMinutes: number,
): string => {
  if (scheduledMinutes < task.estimatedMinutes) {
    return `${task.title} 可拆分，当前先放入 ${scheduledMinutes} 分钟片段；窗口原因：${window.reason}`
  }

  if (task.intensity === 'deep') {
    return `${task.title} 是 ${task.priority} 深度任务，匹配到 ${window.type} 窗口推进。`
  }

  if (task.intensity === 'light') {
    return `${task.title} 是轻量任务，适合放入碎片或低压力窗口。`
  }

  if (task.intensity === 'recovery') {
    return `${task.title} 是恢复型任务，安排在恢复窗口帮助状态回落。`
  }

  return `${task.title} 根据优先级、截止时间和窗口长度安排。`
}

const findRecoveryWindowIndex = (windows: WorkingWindow[]): number => {
  const preferredStartMinutes = timeToMinutes('10:30')
  const preferredIndex = windows.findIndex(
    (window) =>
      window.cursorMinutes >= preferredStartMinutes &&
      window.remainingMinutes >= RECOVERY_MINUTES &&
      window.type !== 'sleep',
  )

  if (preferredIndex >= 0) return preferredIndex

  return windows.findIndex(
    (window) => window.remainingMinutes >= RECOVERY_MINUTES && window.type !== 'sleep',
  )
}

const reserveRecoveryBlock = (windows: WorkingWindow[]): ScheduleBlock | undefined => {
  const windowIndex = findRecoveryWindowIndex(windows)

  if (windowIndex < 0) return undefined

  const window = windows[windowIndex]
  const startTime = minutesToTime(window.cursorMinutes)
  const endTime = minutesToTime(window.cursorMinutes + RECOVERY_MINUTES)

  window.cursorMinutes += RECOVERY_MINUTES
  window.remainingMinutes -= RECOVERY_MINUTES

  return {
    id: 'recovery-low-sleep',
    title: '睡眠不足恢复窗口',
    startTime,
    endTime,
    type: 'rest',
    sourceType: 'recovery',
    priority: 'P1',
    reason: '睡眠评分偏低，先插入 15 分钟恢复窗口，避免上午过早消耗精力。',
    isAdjusted: true,
  }
}

const getScheduledMinutes = (task: Task, window: WorkingWindow): number => {
  if (window.remainingMinutes >= task.estimatedMinutes) return task.estimatedMinutes
  if (!task.splittable || window.remainingMinutes < MIN_SPLIT_MINUTES) return 0

  return Math.min(task.estimatedMinutes, window.remainingMinutes)
}

export const generateSchedulePlan = ({
  date,
  fixedSchedules,
  tasks,
  userState,
}: GenerateSchedulePlanParams): SchedulePlan => {
  const blocks: ScheduleBlock[] = fixedSchedules.map(fixedScheduleToBlock)
  const windows: WorkingWindow[] = buildTimeWindows(fixedSchedules).map((window) => ({
    ...window,
    cursorMinutes: timeToMinutes(window.startTime),
    remainingMinutes: window.durationMinutes,
  }))
  const scheduledTaskIds = new Set<string>()

  if (userState.sleepScore < 60) {
    const recoveryBlock = reserveRecoveryBlock(windows)

    if (recoveryBlock) {
      blocks.push(recoveryBlock)
    }
  }

  sortTasksForScheduling(tasks).forEach((task) => {
    const windowIndex = windows.findIndex((window) => {
      const availableWindow = createAvailableWindow(window)
      const scheduledMinutes = getScheduledMinutes(task, window)

      return (
        scheduledMinutes > 0 &&
        canTaskFitWindow(task, availableWindow, userState)
      )
    })

    if (windowIndex < 0) return

    const window = windows[windowIndex]
    const availableWindow = createAvailableWindow(window)
    const scheduledMinutes = getScheduledMinutes(task, window)
    const startTime = minutesToTime(window.cursorMinutes)
    const endTime = minutesToTime(window.cursorMinutes + scheduledMinutes)

    blocks.push({
      id: `task-${task.id}-${startTime.replace(':', '')}`,
      title: task.title,
      startTime,
      endTime,
      type: getBlockTypeForTask(task, availableWindow),
      sourceType: task.intensity === 'recovery' ? 'recovery' : 'task',
      sourceId: task.id,
      priority: task.priority,
      reason: createTaskReason(task, availableWindow, scheduledMinutes),
      isAdjusted: scheduledMinutes < task.estimatedMinutes || userState.sleepScore < 60,
    })

    scheduledTaskIds.add(task.id)
    window.cursorMinutes += scheduledMinutes
    window.remainingMinutes -= scheduledMinutes
  })

  const unscheduledCount = tasks.length - scheduledTaskIds.size
  const strategy =
    userState.sleepScore < 60
      ? '今日排期已降低上午深度任务密度，并插入恢复窗口。'
      : '今日排期优先保留固定日程，并按优先级和截止时间安排任务。'

  return {
    date,
    blocks: sortByStartTime(blocks),
    summary:
      unscheduledCount > 0
        ? `${strategy} 仍有 ${unscheduledCount} 个任务等待后续窗口。`
        : `${strategy} 所有可安排任务已进入今日窗口。`,
    generatedAt: new Date().toISOString(),
  }
}
