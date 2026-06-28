export type DashboardMetric = {
  label: string
  value: string
  note: string
}

export type FocusTask = {
  title: string
  priority: string
  window: string
}

export type DashboardProps = {
  metrics?: DashboardMetric[]
  recommendation?: {
    label: string
    title: string
    reason: string
  }
  focusTasks?: FocusTask[]
}

const defaultMetrics: DashboardMetric[] = [
  { label: 'Sleep', value: '62', note: 'Light recovery needed' },
  { label: 'Stress', value: 'Medium', note: 'Avoid heavy communication' },
  { label: 'Focus', value: 'Normal', note: 'Best before noon' },
  { label: 'Autonomy', value: 'Ask', note: 'Confirm major changes' },
]

const defaultFocusTasks: FocusTask[] = [
  {
    title: 'Agent decision loop prototype',
    priority: 'P1',
    window: '09:30-10:45',
  },
  {
    title: 'Demo reschedule animation',
    priority: 'P1',
    window: '14:00-15:10',
  },
  {
    title: '3-minute pitch polish',
    priority: 'P2',
    window: '16:20-17:00',
  },
]

const defaultRecommendation = {
  label: 'Recommended now',
  title: 'Keep the next focus block, but reduce the first sprint to 45 minutes.',
  reason:
    'Sleep quality is slightly low and pressure is rising. The agent protects momentum while leaving room for recovery.',
}

export function Dashboard({
  metrics = defaultMetrics,
  recommendation = defaultRecommendation,
  focusTasks = defaultFocusTasks,
}: DashboardProps) {
  return (
    <section className="panel dashboard-panel" aria-labelledby="dashboard-title">
      <div className="panel-title">
        <p className="eyebrow">Dashboard</p>
        <h2 id="dashboard-title">Today state and priority</h2>
      </div>

      <div className="advice-card">
        <span>{recommendation.label}</span>
        <strong>{recommendation.title}</strong>
        <p>{recommendation.reason}</p>
      </div>

      <div className="state-grid">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="focus-list" aria-label="Today focus tasks">
        {focusTasks.map((task) => (
          <article className="focus-task" key={task.title}>
            <span>{task.priority}</span>
            <strong>{task.title}</strong>
            <p>{task.window}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

