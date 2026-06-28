import type { ExternalEvent, NotificationChannel, Priority } from '../types'

export type GitHubInboxItem = {
  id: string
  title: string
  repo: string
  url: string
  kind: 'issue' | 'pull_request' | 'notification' | 'review_request' | 'mention'
  reason: string
  updatedAt: string
  labels: string[]
  priority: Priority
  requiredAction: boolean
  estimatedMinutes: number
  summary: string
}

type GitHubInboxResponse = {
  username: string
  fetchedAt: string
  items: GitHubInboxItem[]
  counts: {
    notifications: number
    assigned: number
    involved: number
    reviewRequested: number
    merged: number
  }
  error?: string
}

const getInterruptLevel = (
  priority: Priority,
  requiredAction: boolean,
): NotificationChannel => {
  if (priority === 'P0') return 'immediate'
  if (priority === 'P1' && requiredAction) return 'immediate'
  if (priority === 'P2') return 'digest'

  return 'silent'
}

export const mapInboxItemToExternalEvent = (item: GitHubInboxItem): ExternalEvent => ({
  id: `github-${item.id}`,
  title: `GitHub ${item.kind}: ${item.title}`,
  source: 'github',
  priority: item.priority,
  receivedAt: item.updatedAt,
  requiredAction: item.requiredAction,
  estimatedMinutes: item.estimatedMinutes,
  interruptLevel: getInterruptLevel(item.priority, item.requiredAction),
  summary: item.summary,
  url: item.url,
  repo: item.repo,
  kind: item.kind,
})

export const fetchGitHubInbox = async (): Promise<GitHubInboxResponse> => {
  const response = await fetch('/api/github/inbox')
  const data = (await response.json()) as GitHubInboxResponse

  if (!response.ok) {
    throw new Error(data.error ?? 'GitHub inbox request failed')
  }

  return data
}
