import { useMemo, useState } from 'react'
import { getDurationMinutes, timeToMinutes } from '../utils/time'

export type TimelineItem = {
  time: string
  endTime?: string
  date?: string
  title: string
  description: string
  mode: 'focus' | 'micro' | 'rest' | 'sleep' | 'fixed' | 'buffer'
  priority?: 'P0' | 'P1' | 'P2' | 'P3'
}

export type TimelineProps = {
  items?: TimelineItem[]
}

type WeekDay = {
  date: Date
  key: string
  weekday: string
  label: string
}

const defaultItems: TimelineItem[] = [
  {
    date: '2026-06-28',
    time: '08:30',
    endTime: '09:00',
    title: 'Morning startup',
    description: 'Low friction planning window',
    mode: 'micro',
    priority: 'P2',
  },
  {
    date: '2026-06-28',
    time: '09:30',
    endTime: '11:30',
    title: 'Deep work block',
    description: 'Agent decision loop prototype',
    mode: 'focus',
    priority: 'P1',
  },
]

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const calendarStartHour = 8
const calendarEndHour = 23
const rowHeight = 54
const hourRows = Array.from(
  { length: calendarEndHour - calendarStartHour + 1 },
  (_, index) => calendarStartHour + index,
)

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const parseDate = (value?: string): Date => {
  if (!value) return new Date('2026-06-28T00:00:00')

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? new Date('2026-06-28T00:00:00') : date
}

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date)

  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date)

  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)

  return weekStart
}

const createWeekDays = (weekStart: Date): WeekDay[] =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)

    return {
      date,
      key: formatDateKey(date),
      weekday: dayLabels[date.getDay()],
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    }
  })

const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = addDays(weekStart, 6)
  const startLabel = `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日`
  const endLabel =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? `${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
      : `${weekEnd.getFullYear()}年${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`

  return `${startLabel} - ${endLabel}`
}

const getEventPosition = (item: TimelineItem) => {
  const startMinutes = Math.max(
    timeToMinutes(item.time),
    calendarStartHour * 60,
  )
  const endTime = item.endTime ?? item.time
  const durationMinutes = Math.max(getDurationMinutes(item.time, endTime), 25)
  const top = ((startMinutes - calendarStartHour * 60) / 60) * rowHeight
  const height = Math.max((durationMinutes / 60) * rowHeight, 30)

  return {
    top,
    height,
  }
}

export function Timeline({ items = defaultItems }: TimelineProps) {
  const firstItemDate = items.find((item) => item.date)?.date
  const initialWeekStart = useMemo(
    () => getWeekStart(parseDate(firstItemDate)),
    [firstItemDate],
  )
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(
    () => addDays(initialWeekStart, weekOffset * 7),
    [initialWeekStart, weekOffset],
  )
  const weekDays = useMemo(() => createWeekDays(weekStart), [weekStart])
  const visibleItems = useMemo(() => {
    const weekDayKeys = new Set(weekDays.map((day) => day.key))

    return items.filter((item) => weekDayKeys.has(item.date ?? formatDateKey(weekStart)))
  }, [items, weekDays, weekStart])

  return (
    <aside className="panel timeline-panel calendar-panel" aria-labelledby="timeline-title">
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2 id="timeline-title">{formatWeekRange(weekStart)}</h2>
        </div>
        <div className="calendar-controls" aria-label="Calendar controls">
          <button className="secondary" onClick={() => setWeekOffset(0)} type="button">
            今天
          </button>
          <button aria-label="上一周" className="secondary icon-button" onClick={() => setWeekOffset((value) => value - 1)} type="button">
            ‹
          </button>
          <button aria-label="下一周" className="secondary icon-button" onClick={() => setWeekOffset((value) => value + 1)} type="button">
            ›
          </button>
          <div className="calendar-mode-tabs" aria-label="Calendar view mode">
            <span>日</span>
            <span className="active">周</span>
            <span>月</span>
          </div>
        </div>
      </div>

      <div className="calendar-grid-shell">
        <div className="calendar-week-grid">
          <div className="calendar-timezone">GMT+8</div>
          {weekDays.map((day) => (
            <div className="calendar-day-head" key={day.key}>
              <span>{day.weekday}</span>
              <strong>{day.label}</strong>
            </div>
          ))}

          <div className="calendar-time-axis">
            {hourRows.map((hour) => (
              <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>
            ))}
          </div>

          {weekDays.map((day) => (
            <div className="calendar-day-column" key={day.key}>
              {hourRows.map((hour) => (
                <span className="calendar-hour-line" key={hour} />
              ))}
              {visibleItems
                .filter((item) => (item.date ?? formatDateKey(weekStart)) === day.key)
                .map((item) => {
                  const { top, height } = getEventPosition(item)

                  return (
                    <article
                      className={`calendar-event ${item.mode} ${item.priority?.toLowerCase() ?? ''}`}
                      key={`${day.key}-${item.time}-${item.title}`}
                      style={{ height, top }}
                    >
                      <div className="calendar-event-head">
                        <strong>{item.title}</strong>
                        {item.priority && <span>{item.priority}</span>}
                      </div>
                      <time>{item.endTime ? `${item.time} - ${item.endTime}` : item.time}</time>
                      <p>{item.description}</p>
                    </article>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
