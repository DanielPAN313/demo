import type { NotificationItem } from '../../../types'

type AttentionFirewallProps = {
  notifications: NotificationItem[]
}

const routeCopy = {
  immediate: 'Interrupt now',
  defer: 'Remind later',
  digest: 'Morning brief',
  silent: 'Silent archive',
}

export function AttentionFirewall({ notifications }: AttentionFirewallProps) {
  return (
    <section className="panel" aria-labelledby="firewall-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attention firewall</p>
          <h2 id="firewall-title">Notification routing</h2>
        </div>
      </div>

      <div className="firewall-list">
        {notifications.length === 0 ? (
          <p className="muted">Trigger a P1 event to see routing decisions.</p>
        ) : (
          notifications.map(({ channel, title, reason, id }) => (
            <article className={`route-card ${channel}`} key={id}>
              <span>{routeCopy[channel]}</span>
              <strong>{title}</strong>
              <p>{reason}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

