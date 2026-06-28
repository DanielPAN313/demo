import type { ScheduleBlock, Task } from '../../../types'
import { modeLabel } from '../../../utils/format'

type RhythmTimelineProps = {
  schedule: ScheduleBlock[]
  tasks: Task[]
}

export function RhythmTimeline({ schedule, tasks }: RhythmTimelineProps) {
  const taskById = new Map(tasks.map((task) => [task.id, task]))

  return (
    <section className="panel rhythm-panel" aria-labelledby="rhythm-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Today rhythm</p>
          <h2 id="rhythm-title">24h schedule map</h2>
        </div>
        <span className="status-pill">Demo data</span>
      </div>

      <div className="timeline">
        {schedule.map((block) => {
          const task = block.sourceId ? taskById.get(block.sourceId) : undefined

          return (
            <article className={`timeline-block ${block.type}`} key={block.id}>
              <div className="time-range">
                <span>{block.startTime}</span>
                <span>{block.endTime}</span>
              </div>
              <div>
                <div className="block-header">
                  <strong>{block.title}</strong>
                  <span>{modeLabel[block.type]}</span>
                </div>
                <div className="task-list">
                  {task ? (
                    <span className="task-chip">
                      {task.priority} - {task.title}
                    </span>
                  ) : (
                    <span className="muted">Protected time</span>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

