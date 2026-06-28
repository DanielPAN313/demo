import type { SuggestedAction } from '../types'

export type AgentMessage = {
  id?: string
  role: 'user' | 'agent' | 'system'
  text: string
}

export type AgentPanelProps = {
  explanation?: string
  suggestion?: string
  messages?: AgentMessage[]
  suggestedActions?: SuggestedAction[]
}

const defaultMessages: AgentMessage[] = [
  {
    role: 'user',
    text: 'I am tired now. Help me reschedule the afternoon.',
  },
  {
    role: 'agent',
    text: 'I will move low-priority work later, keep the demo-critical task, and add a recovery window before the next focus block.',
  },
]

export function AgentPanel({
  explanation = 'The agent detected reduced energy and protected the current focus block from non-urgent interruptions.',
  suggestion = 'Move lightweight tasks into the next micro-slot and keep P1 demo work visible.',
  messages = defaultMessages,
  suggestedActions = [],
}: AgentPanelProps) {
  return (
    <section className="panel agent-chat-panel" aria-labelledby="agent-panel-title">
      <div className="panel-title">
        <p className="eyebrow">Agent panel</p>
        <h2 id="agent-panel-title">Explanation and chat</h2>
      </div>

      <div className="agent-explain">
        <article>
          <span>Explanation</span>
          <p>{explanation}</p>
        </article>
        <article>
          <span>Suggestion</span>
          <p>{suggestion}</p>
        </article>
      </div>

      {suggestedActions.length > 0 && (
        <div className="suggested-actions" aria-label="Suggested agent actions">
          {suggestedActions.map((action) => (
            <button className="secondary" key={action.id} type="button">
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="chat-box">
        {messages.map((message) => (
          <div
            className={`chat-message ${message.role}`}
            key={message.id ?? `${message.role}-${message.text}`}
          >
            {message.text}
          </div>
        ))}
        <div className="chat-input" aria-label="Agent chat placeholder">
          Ask the rhythm agent...
        </div>
      </div>
    </section>
  )
}
