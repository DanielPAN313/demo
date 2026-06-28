export type WebSearchResult = {
  title: string
  url: string
  snippet: string
}

type WebSearchResponse = {
  query: string
  results: WebSearchResult[]
  error?: string
  detail?: string
}

export const searchWeb = async (query: string): Promise<WebSearchResult[]> => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const data = (await response.json()) as WebSearchResponse

  if (!response.ok) {
    throw new Error(data.detail ?? data.error ?? 'Search request failed')
  }

  return data.results
}
