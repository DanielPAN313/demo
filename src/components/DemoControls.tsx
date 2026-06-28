export type DemoAction = {
  id: string
  label: string
  description?: string
  variant?: 'primary' | 'secondary'
}

export type DemoControlsProps = {
  actions?: DemoAction[]
  activeActionId?: string
  onAction?: (action: DemoAction) => void
}

const defaultActions: DemoAction[] = [
  { id: 'poorSleep', label: '睡眠差', description: '降低上午深度任务密度' },
  { id: 'highStress', label: '压力高', description: '延后强沟通任务' },
  { id: 'githubP1', label: '插入 GitHub P1', description: '触发突发事件解释' },
  { id: 'nightMode', label: '进入夜间模式', description: '普通通知静默归档' },
  { id: 'morningBrief', label: '生成晨报', description: '汇总夜间事件和今日建议' },
  { id: 'reset', label: '重置演示', description: '回到初始状态', variant: 'secondary' },
]

export function DemoControls({
  actions = defaultActions,
  activeActionId,
  onAction,
}: DemoControlsProps) {
  return (
    <section className="panel demo-controls-panel" aria-labelledby="demo-controls-title">
      <div className="panel-title">
        <p className="eyebrow">Demo triggers</p>
        <h2 id="demo-controls-title">现场演示控制</h2>
      </div>

      <div className="demo-actions" aria-label="Demo actions">
        {actions.map((action) => (
          <button
            className={[
              action.variant === 'secondary' ? 'secondary' : '',
              activeActionId === action.id ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={action.id}
            onClick={() => onAction?.(action)}
            type="button"
          >
            <span>{action.label}</span>
            {action.description && <small>{action.description}</small>}
          </button>
        ))}
      </div>
    </section>
  )
}
