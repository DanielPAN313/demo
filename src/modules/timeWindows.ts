import type { FixedSchedule, TimeBlockType } from '../types'
import {
  getDurationMinutes,
  isTimeInRange,
  minutesToTime,
  sortByStartTime,
  timeToMinutes,
} from '../utils/time'

export type TimeWindow = {
  id: string
  startTime: string
  endTime: string
  durationMinutes: number
  type: TimeBlockType
  reason: string
}

const MIN_WINDOW_MINUTES = 5

const getWindowReason = (
  type: TimeBlockType,
  startTime: string,
  endTime: string,
  durationMinutes: number,
): string => {
  if (type === 'sleep') return '睡眠保护窗口，不建议安排任务。'
  if (type === 'focus' && isTimeInRange(startTime, '09:00', '12:00')) {
    return '上午高专注窗口，适合深度任务。'
  }
  if (type === 'focus' && isTimeInRange(startTime, '14:00', '17:30')) {
    return '下午专注窗口，适合推进高优任务。'
  }
  if (type === 'micro') return '碎片窗口，适合轻量事项。'
  if (type === 'rest' && isTimeInRange(startTime, '18:00', '22:30')) {
    return '晚间恢复窗口，适合休息、运动或低强度任务。'
  }
  if (type === 'rest') return '恢复窗口，适合低压力安排。'
  if (durationMinutes >= 45) return '可用缓冲窗口，可按状态安排任务。'

  return `${startTime}-${endTime} 可排任务窗口。`
}

const createTimeWindow = (startTime: string, endTime: string): TimeWindow | null => {
  const durationMinutes = getDurationMinutes(startTime, endTime)

  if (durationMinutes < MIN_WINDOW_MINUTES) return null

  const type = classifyWindow(startTime, endTime)

  return {
    id: `window-${startTime.replace(':', '')}-${endTime.replace(':', '')}`,
    startTime,
    endTime,
    durationMinutes,
    type,
    reason: getWindowReason(type, startTime, endTime, durationMinutes),
  }
}

export const classifyWindow = (startTime: string, endTime: string): TimeBlockType => {
  const durationMinutes = getDurationMinutes(startTime, endTime)

  if (
    isTimeInRange(startTime, '23:00', '07:00') ||
    isTimeInRange(endTime, '23:00', '07:00')
  ) {
    return 'sleep'
  }

  if (
    durationMinutes > 30 &&
    isTimeInRange(startTime, '09:00', '12:00') &&
    timeToMinutes(endTime) <= timeToMinutes('12:00')
  ) {
    return 'focus'
  }

  if (
    durationMinutes > 30 &&
    isTimeInRange(startTime, '14:00', '17:30') &&
    timeToMinutes(endTime) <= timeToMinutes('17:30')
  ) {
    return 'focus'
  }

  if (durationMinutes >= 5 && durationMinutes <= 30) {
    return 'micro'
  }

  if (
    isTimeInRange(startTime, '18:00', '22:30') ||
    isTimeInRange(endTime, '18:00', '22:30')
  ) {
    return 'rest'
  }

  return durationMinutes >= 45 ? 'rest' : 'micro'
}

export const getFreeWindows = (
  fixedSchedules: FixedSchedule[],
  dayStart: string,
  dayEnd: string,
): TimeWindow[] => {
  const dayStartMinutes = timeToMinutes(dayStart)
  const dayEndMinutes = timeToMinutes(dayEnd)
  const lockedSchedules = sortByStartTime(
    fixedSchedules.filter((schedule) => schedule.locked),
  )
  const windows: TimeWindow[] = []
  let cursorMinutes = dayStartMinutes

  lockedSchedules.forEach((schedule) => {
    const scheduleStartMinutes = timeToMinutes(schedule.startTime)
    const scheduleEndMinutes = timeToMinutes(schedule.endTime)

    if (scheduleEndMinutes <= dayStartMinutes || scheduleStartMinutes >= dayEndMinutes) {
      return
    }

    const blockedStartMinutes = Math.max(scheduleStartMinutes, dayStartMinutes)
    const blockedEndMinutes = Math.min(scheduleEndMinutes, dayEndMinutes)

    if (blockedStartMinutes > cursorMinutes) {
      const window = createTimeWindow(
        minutesToTime(cursorMinutes),
        minutesToTime(blockedStartMinutes),
      )

      if (window) windows.push(window)
    }

    cursorMinutes = Math.max(cursorMinutes, blockedEndMinutes)
  })

  if (cursorMinutes < dayEndMinutes) {
    const window = createTimeWindow(minutesToTime(cursorMinutes), dayEnd)

    if (window) windows.push(window)
  }

  return windows
}

export const buildTimeWindows = (fixedSchedules: FixedSchedule[]): TimeWindow[] =>
  getFreeWindows(fixedSchedules, '07:00', '23:30')
