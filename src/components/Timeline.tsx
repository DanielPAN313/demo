export type TimelineItem = {
  time: string
  title: string
  description: string
  mode: 'focus' | 'micro' | 'rest' | 'sleep' | 'fixed' | 'buffer'
}

export type TimelineProps = {
  items?: TimelineItem[]
}

const defaultItems: TimelineItem[] = [
  {
    time: '08:30',
    title: 'Morning startup',
    description: 'Low friction planning window',
    mode: 'micro',
  },
  {
    time: '09:30',
    title: 'Deep work block',
    description: 'Agent decision loop prototype',
    mode: 'focus',
  },
  {
    time: '12:10',
    title: 'Micro-slot cleanup',
    description: 'Messages, PR summary, quick notes',
    mode: 'micro',
  },
  {
    time: '14:00',
    title: 'Demo build sprint',
    description: 'Reschedule flow and explanation panel',
    mode: 'focus',
  },
  {
    time: '20:30',
    title: 'Low-disturbance rest',
    description: 'Normal updates move to briefing',
    mode: 'rest',
  },
  {
    time: '23:30',
    title: 'Night silent mode',
    description: 'Archive external events without interruption',
    mode: 'sleep',
  },
]

export function Timeline({ items = defaultItems }: TimelineProps) {
  return (
    <aside className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-title">
        <p className="eyebrow">Timeline</p>
        <h2 id="timeline-title">Today schedule</h2>
      </div>

      <div className="timeline-list">
        {items.map((item) => (
          <article className={`timeline-item ${item.mode}`} key={`${item.time}-${item.title}`}>
            <time>{item.time}</time>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
