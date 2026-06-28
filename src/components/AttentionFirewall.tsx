export type FirewallRoute = 'urgent' | 'later' | 'brief' | 'silent'

export type FirewallItem = {
  route: FirewallRoute
  label: string
  title: string
  description: string
}

export type AttentionFirewallProps = {
  items?: FirewallItem[]
}

const defaultItems: FirewallItem[] = [
  {
    route: 'urgent',
    label: '立即打扰',
    title: 'P1 Issue before deadline',
    description: '影响演示主路径，允许打断当前节奏。',
  },
  {
    route: 'later',
    label: '稍后提醒',
    title: 'Non-blocking review note',
    description: '放到下一个碎片窗口，保护当前专注块。',
  },
  {
    route: 'brief',
    label: '晨报汇总',
    title: 'Overnight GitHub updates',
    description: '夜间不唤醒用户，早上统一说明。',
  },
  {
    route: 'silent',
    label: '静默归档',
    title: 'Low-priority social ping',
    description: '低优先级更新先归档，等待用户主动查看。',
  },
]

const routeLabel: Record<FirewallRoute, string> = {
  urgent: '打断',
  later: '延后',
  brief: '汇总',
  silent: '静默',
}

export function AttentionFirewall({ items = defaultItems }: AttentionFirewallProps) {
  return (
    <aside className="panel firewall-panel" aria-labelledby="firewall-title">
      <div className="panel-title">
        <p className="eyebrow">Attention firewall</p>
        <h2 id="firewall-title">通知分流</h2>
      </div>

      <div className="firewall-stack">
        {items.map((item) => (
          <article className={`firewall-item ${item.route}`} key={`${item.route}-${item.title}`}>
            <div className="firewall-head">
              <span>{item.label}</span>
              <em>{routeLabel[item.route]}</em>
            </div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </aside>
  )
}
