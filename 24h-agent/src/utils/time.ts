const MINUTES_PER_DAY = 24 * 60

const clampToDay = (minutes: number): number =>
  Math.min(Math.max(minutes, 0), MINUTES_PER_DAY - 1)

const padTimePart = (value: number): string => String(value).padStart(2, '0')

export const timeToMinutes = (time: string): number => {
  const [hourPart, minutePart] = time.split(':')
  const hours = Number(hourPart)
  const minutes = Number(minutePart)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 0
  }

  return hours * 60 + minutes
}

export const minutesToTime = (minutes: number): string => {
  if (!Number.isFinite(minutes)) return '00:00'

  const normalizedMinutes = clampToDay(Math.floor(minutes))
  const hours = Math.floor(normalizedMinutes / 60)
  const restMinutes = normalizedMinutes % 60

  return `${padTimePart(hours)}:${padTimePart(restMinutes)}`
}

export const getDurationMinutes = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (endMinutes < startMinutes) {
    return endMinutes + MINUTES_PER_DAY - startMinutes
  }

  return endMinutes - startMinutes
}

export const isTimeInRange = (
  time: string,
  startTime: string,
  endTime: string,
): boolean => {
  const targetMinutes = timeToMinutes(time)
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes === endMinutes) return targetMinutes === startMinutes

  if (endMinutes < startMinutes) {
    return targetMinutes >= startMinutes || targetMinutes < endMinutes
  }

  return targetMinutes >= startMinutes && targetMinutes < endMinutes
}

export const sortByStartTime = <T extends { startTime: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

export const overlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean => {
  const aStartMinutes = timeToMinutes(aStart)
  const aEndMinutes = timeToMinutes(aEnd)
  const bStartMinutes = timeToMinutes(bStart)
  const bEndMinutes = timeToMinutes(bEnd)

  return aStartMinutes < bEndMinutes && bStartMinutes < aEndMinutes
}

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60

  return restMinutes === 0 ? `${hours}h` : `${hours}h ${restMinutes}m`
}
