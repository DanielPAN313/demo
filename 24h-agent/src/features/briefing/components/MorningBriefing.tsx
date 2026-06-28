import type { AgentResult } from '../../../types'

type MorningBriefingProps = {
  brief: AgentResult
}

export function MorningBriefing({ brief }: MorningBriefingProps) {
  return (
    <section className="panel" aria-labelledby="brief-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Morning briefing</p>
          <h2 id="brief-title">Night summary</h2>
        </div>
      </div>

      <div className="brief-list">
        {(brief.notifications ?? []).map((notification) => (
          <article key={notification.id}>
            <strong>{notification.title}</strong>
            <p>{notification.reason}</p>
          </article>
        ))}
      </div>

      <div className="explain-box">
        {(brief.explanations ?? []).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  )
}

