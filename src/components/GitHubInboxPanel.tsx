import type { GitHubInboxItem } from '../types'

type GitHubInboxPanelProps = {
  items: GitHubInboxItem[]
  status: string
}

const labelByKind: Record<GitHubInboxItem['kind'], string> = {
  issue: 'Issue',
  pull_request: 'PR',
  notification: 'Notice',
  review_request: 'Review',
  mention: 'Mention',
}

const formatUpdatedAt = (value: string): string =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export function GitHubInboxPanel({ items, status }: GitHubInboxPanelProps) {
  const safeItems = items ?? []

  return (
    <section className="panel github-inbox-panel" aria-labelledby="github-inbox-title">
      <div className="panel-title">
        <p className="eyebrow">GitHub inbox</p>
        <h2 id="github-inbox-title">Live items</h2>
      </div>

      <div className="github-status">{status}</div>

      <div className="github-item-list" aria-label="GitHub inbox items">
        {safeItems.length === 0 ? (
          <p className="empty-state">No GitHub items synced yet.</p>
        ) : (
          safeItems.slice(0, 8).map((item) => (
            <article className="github-item" key={item.id}>
              <div className="github-item-meta">
                <span className={`priority-badge ${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
                <span>{labelByKind[item.kind]}</span>
                <time>{formatUpdatedAt(item.updatedAt)}</time>
              </div>
              <a href={item.url} rel="noreferrer" target="_blank">
                {item.title}
              </a>
              <p>{item.repo}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
