import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import type { ServerResponse } from 'node:http'
import { promisify } from 'node:util'

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type DeepSeekProxyRequest = {
  agentName?: string
  messages?: DeepSeekMessage[]
  temperature?: number
  maxTokens?: number
}

type DeepSeekCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  model?: string
  usage?: unknown
}

type SearchProxyRequest = {
  query?: string
}

type SearchResult = {
  title: string
  url: string
  snippet: string
}

type GitHubNotification = {
  id: string
  unread: boolean
  reason: string
  updated_at: string
  repository: {
    full_name: string
    html_url?: string
  }
  subject: {
    title: string
    type: string
    url: string
    latest_comment_url?: string
  }
}

type GitHubSearchItem = {
  id: number
  number: number
  title: string
  html_url: string
  repository_url: string
  labels: Array<{ name: string }>
  state: string
  pull_request?: unknown
  updated_at: string
  user?: {
    login: string
  }
}

type GitHubInboxItem = {
  id: string
  title: string
  repo: string
  url: string
  kind: 'issue' | 'pull_request' | 'notification' | 'review_request' | 'mention'
  reason: string
  updatedAt: string
  labels: string[]
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  requiredAction: boolean
  estimatedMinutes: number
  summary: string
}

const execFileAsync = promisify(execFile)

const readRequestBody = async (request: NodeJS.ReadableStream): Promise<string> => {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }

  return Buffer.concat(chunks).toString('utf8')
}

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const stripHtml = (value: string): string =>
  decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())

const fetchSearchHtml = async (searchUrl: string): Promise<string> => {
  try {
    const upstreamResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      },
    })
    const html = await upstreamResponse.text()

    if (!upstreamResponse.ok) {
      throw new Error(`Search request failed: ${upstreamResponse.status}`)
    }

    return html
  } catch {
    const { stdout } = await execFileAsync('curl.exe', [
      '-L',
      '-s',
      '--max-time',
      '15',
      '-A',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      searchUrl,
    ])

    return stdout
  }
}

const createSearchProxyPlugin = (): Plugin => ({
  name: 'local-search-proxy',
  configureServer(server) {
    server.middlewares.use('/api/search', async (request, response) => {
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }

      try {
        const body = JSON.parse(await readRequestBody(request)) as SearchProxyRequest
        const query = body.query?.trim()

        if (!query) {
          sendJson(response, 400, { error: 'query is required' })
          return
        }

        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`
        const html = await fetchSearchHtml(searchUrl)

        const resultPattern =
          /<li class="b_algo"[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g
        const results: SearchResult[] = []
        let match: RegExpExecArray | null

        while ((match = resultPattern.exec(html)) && results.length < 5) {
          const url = decodeHtmlEntities(match[1])
          const title = stripHtml(match[2])
          const snippet = stripHtml(match[3])

          if (title && url) {
            results.push({ title, url, snippet })
          }
        }

        sendJson(response, 200, { query, results })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown search error'
        sendJson(response, 200, { query: '', results: [], warning: message })
      }
    })
  },
})

const getRepoFromRepositoryUrl = (repositoryUrl: string): string =>
  repositoryUrl.split('/repos/')[1] ?? repositoryUrl

const getGitHubPriority = (
  title: string,
  labels: string[],
  reason: string,
): GitHubInboxItem['priority'] => {
  const haystack = `${title} ${labels.join(' ')} ${reason}`.toLowerCase()

  if (haystack.includes('p0') || haystack.includes('urgent') || haystack.includes('critical')) {
    return 'P0'
  }

  if (
    haystack.includes('p1') ||
    haystack.includes('bug') ||
    haystack.includes('review_requested') ||
    haystack.includes('ci') ||
    haystack.includes('failing')
  ) {
    return 'P1'
  }

  if (haystack.includes('p2') || haystack.includes('enhancement')) {
    return 'P2'
  }

  return 'P3'
}

const getGitHubEstimate = (
  kind: GitHubInboxItem['kind'],
  priority: GitHubInboxItem['priority'],
): number => {
  if (kind === 'review_request') return 35
  if (kind === 'pull_request') return priority === 'P1' || priority === 'P0' ? 45 : 25
  if (kind === 'issue') return priority === 'P1' || priority === 'P0' ? 60 : 30

  return 15
}

const githubRequest = async <T>(
  path: string,
  token: string,
  searchParams?: Record<string, string>,
): Promise<T> => {
  const url = new URL(`https://api.github.com${path}`)

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': '24h-assistant-local',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`GitHub ${path} failed: ${response.status} ${text}`)
  }

  return JSON.parse(text) as T
}

const mapSearchItemToInboxItem = (
  item: GitHubSearchItem,
  reason: GitHubInboxItem['reason'],
): GitHubInboxItem => {
  const labels = item.labels.map((label) => label.name)
  const kind = item.pull_request ? 'pull_request' : 'issue'
  const priority = getGitHubPriority(item.title, labels, reason)
  const repo = getRepoFromRepositoryUrl(item.repository_url)
  const estimatedMinutes = getGitHubEstimate(kind, priority)

  return {
    id: `${reason}-${item.id}`,
    title: item.title,
    repo,
    url: item.html_url,
    kind,
    reason,
    updatedAt: item.updated_at,
    labels,
    priority,
    requiredAction: priority === 'P0' || priority === 'P1' || reason === 'review_requested',
    estimatedMinutes,
    summary: `${reason} in ${repo}: ${item.title}`,
  }
}

const mapNotificationToInboxItem = (notification: GitHubNotification): GitHubInboxItem => {
  const kind =
    notification.reason === 'mention'
      ? 'mention'
      : notification.subject.type === 'PullRequest'
        ? 'pull_request'
        : notification.subject.type === 'Issue'
          ? 'issue'
          : 'notification'
  const priority = getGitHubPriority(notification.subject.title, [], notification.reason)
  const estimatedMinutes = getGitHubEstimate(kind, priority)

  return {
    id: `notification-${notification.id}`,
    title: notification.subject.title,
    repo: notification.repository.full_name,
    url: notification.repository.html_url ?? `https://github.com/${notification.repository.full_name}`,
    kind,
    reason: notification.reason,
    updatedAt: notification.updated_at,
    labels: [],
    priority,
    requiredAction: notification.unread || priority === 'P0' || priority === 'P1',
    estimatedMinutes,
    summary: `${notification.reason} notification in ${notification.repository.full_name}: ${notification.subject.title}`,
  }
}

const createGitHubInboxPlugin = (env: Record<string, string>): Plugin => ({
  name: 'github-inbox-proxy',
  configureServer(server) {
    server.middlewares.use('/api/github/inbox', async (request, response) => {
      if (request.method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }

      const token = env.GITHUB_TOKEN
      const username = env.GITHUB_USERNAME

      if (!token || !username) {
        sendJson(response, 500, {
          error: 'GITHUB_TOKEN and GITHUB_USERNAME must be configured',
        })
        return
      }

      try {
        const [notifications, assigned, involved, reviewRequested] = await Promise.all([
          githubRequest<GitHubNotification[]>('/notifications', token, {
            all: 'false',
            participating: 'false',
            per_page: '30',
          }),
          githubRequest<{ items: GitHubSearchItem[] }>('/search/issues', token, {
            q: `assignee:${username} is:open archived:false`,
            per_page: '20',
          }),
          githubRequest<{ items: GitHubSearchItem[] }>('/search/issues', token, {
            q: `involves:${username} is:open archived:false`,
            per_page: '20',
          }),
          githubRequest<{ items: GitHubSearchItem[] }>('/search/issues', token, {
            q: `review-requested:${username} is:pr is:open archived:false`,
            per_page: '20',
          }),
        ])
        const inboxById = new Map<string, GitHubInboxItem>()
        const addItem = (item: GitHubInboxItem) => {
          const key = item.url || item.id
          const existing = inboxById.get(key)

          if (!existing || priorityRankValue(item.priority) < priorityRankValue(existing.priority)) {
            inboxById.set(key, item)
          }
        }

        notifications.map(mapNotificationToInboxItem).forEach(addItem)
        assigned.items
          .map((item) => mapSearchItemToInboxItem(item, 'assigned'))
          .forEach(addItem)
        involved.items
          .map((item) => mapSearchItemToInboxItem(item, 'involved'))
          .forEach(addItem)
        reviewRequested.items
          .map((item) => ({
            ...mapSearchItemToInboxItem(item, 'review_requested'),
            kind: 'review_request' as const,
            requiredAction: true,
          }))
          .forEach(addItem)

        const inbox = [...inboxById.values()].sort(
          (a, b) =>
            priorityRankValue(a.priority) - priorityRankValue(b.priority) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )

        sendJson(response, 200, {
          username,
          fetchedAt: new Date().toISOString(),
          items: inbox.slice(0, 50),
          counts: {
            notifications: notifications.length,
            assigned: assigned.items.length,
            involved: involved.items.length,
            reviewRequested: reviewRequested.items.length,
            merged: inbox.length,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown GitHub error'
        sendJson(response, 500, { error: message })
      }
    })
  },
})

const priorityRankValue = (priority: GitHubInboxItem['priority']): number =>
  ({ P0: 0, P1: 1, P2: 2, P3: 3 })[priority]

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(payload))
}

const createDeepSeekProxyPlugin = (env: Record<string, string>): Plugin => ({
  name: 'deepseek-local-proxy',
  configureServer(server) {
    server.middlewares.use('/api/deepseek/chat', async (request, response) => {
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }

      const apiKey = env.DEEPSEEK_API_KEY
      if (!apiKey) {
        sendJson(response, 500, { error: 'DEEPSEEK_API_KEY is not configured' })
        return
      }

      try {
        const body = JSON.parse(await readRequestBody(request)) as DeepSeekProxyRequest
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          sendJson(response, 400, { error: 'messages must be a non-empty array' })
          return
        }

        const baseUrl = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
        const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: body.messages,
            temperature: body.temperature ?? 0.4,
            max_tokens: body.maxTokens ?? 280,
            thinking: {
              type: 'disabled',
            },
            stream: false,
          }),
        })
        const responseText = await upstreamResponse.text()

        if (!upstreamResponse.ok) {
          sendJson(response, upstreamResponse.status, {
            error: 'DeepSeek request failed',
            detail: responseText,
          })
          return
        }

        const data = JSON.parse(responseText) as DeepSeekCompletionResponse
        const content = data.choices?.[0]?.message?.content?.trim()

        if (!content) {
          sendJson(response, 502, { error: 'DeepSeek returned an empty response' })
          return
        }

        sendJson(response, 200, {
          agentName: body.agentName,
          content,
          model: data.model,
          usage: data.usage,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown proxy error'
        sendJson(response, 500, { error: message })
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      createSearchProxyPlugin(),
      createGitHubInboxPlugin(env),
      createDeepSeekProxyPlugin(env),
    ],
  }
})
