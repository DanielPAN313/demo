import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import {
  AgentPanel,
  AttentionFirewall,
  GitHubInboxPanel,
  MorningBrief,
  Timeline,
} from '../components'
import type {
  AgentMessage as PanelMessage,
  FirewallItem,
  MorningBriefItem,
  TimelineItem,
} from '../components'
import {
  demoScenario,
  initialNotifications,
  initialSchedulePlan,
} from '../data'
import { createAgentEvent } from '../core/agentEvents'
import { fetchGitHubInbox, mapInboxItemToExternalEvent } from '../core/githubInboxClient'
import { runAgentPipeline } from '../core/runAgentPipeline'
import type { AgentRuntimeEvent } from '../core/agentEvents'
import type { AgentResult, NotificationChannel } from '../types'
import { useAppState } from './appStateContext'

const firewallRouteByChannel = {
  immediate: 'urgent',
  defer: 'later',
  digest: 'brief',
  silent: 'silent',
} satisfies Record<NotificationChannel, FirewallItem['route']>

const labelByChannel = {
  immediate: '立即打扰',
  defer: '稍后提醒',
  digest: '晨报汇总',
  silent: '静默归档',
} satisfies Record<NotificationChannel, string>

const scenarioLabel = {
  baseline: '基础节律',
  poorSleep: '睡眠差',
  highStress: '压力高',
  githubP1: 'GitHub P1',
  nightMode: '夜间模式',
  morningBrief: '晨报生成',
} satisfies Record<string, string>

type ApplyAgentResultOptions = {
  compactChat?: boolean
}

function App() {
  const { state, actions } = useAppState()
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [isGitHubWatching] = useState(false)
  const [githubWatchStatus, setGitHubWatchStatus] = useState('GitHub watch off')
  const seenGitHubItemIdsRef = useRef<Set<string>>(new Set())
  const isGitHubWatchCheckingRef = useRef(false)
  const activeSchedulePlan = state.schedulePlan ?? initialSchedulePlan
  const activeNotifications =
    state.notifications.length > 0 ? state.notifications : initialNotifications
  const panelMessages: PanelMessage[] = state.agentMessages.map((message) => ({
    id: message.id,
    role: message.role,
    text: message.content,
  }))

  const applyAgentResult = useCallback((
    result: AgentResult,
    options: ApplyAgentResultOptions = {},
  ) => {
    if (result.schedulePlan) {
      actions.updateSchedulePlan(result.schedulePlan)
    }

    if (result.notifications) {
      actions.updateNotifications(result.notifications)
    }

    if (result.morningBrief) {
      actions.updateMorningBrief(result.morningBrief)
    }

    if (result.suggestedActions) {
      actions.updateSuggestedActions(result.suggestedActions)
    }

    const agentMessages = result.agentMessages ?? []
    const compactMessage =
      result.planningInsight && agentMessages.length > 0
        ? agentMessages[0]
        : agentMessages[agentMessages.length - 1]
    const visibleAgentMessages =
      options.compactChat && agentMessages.length > 0
        ? [compactMessage]
        : agentMessages
    const visibleExplanations = options.compactChat ? [] : result.explanations ?? []
    const messages = [
      ...visibleAgentMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...visibleExplanations.map((explanation) => ({
        role: 'agent' as const,
        content: `解释：${explanation}`,
      })),
    ]

    if (messages.length > 0) {
      actions.addAgentMessages(messages)
    }
  }, [actions])

  const runPipelineAndApply = async (
    event: AgentRuntimeEvent,
    options?: ApplyAgentResultOptions,
  ) => {
    setIsAgentRunning(true)

    try {
      const result = await runAgentPipeline(event)
      applyAgentResult(result, options)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown DeepSeek error'

      actions.addAgentMessages([
        {
          role: 'system',
          content: `DeepSeek API 调用失败：${message}`,
        },
      ])
    } finally {
      setIsAgentRunning(false)
    }
  }

  const checkGitHubInboxForNewItems = useCallback(async (isInitial = false) => {
    if (isGitHubWatchCheckingRef.current) return

    isGitHubWatchCheckingRef.current = true

    try {
      const inbox = await fetchGitHubInbox()
      const knownIds = seenGitHubItemIdsRef.current
      const newItems = isInitial
        ? []
        : inbox.items.filter((item) => !knownIds.has(item.id))

      seenGitHubItemIdsRef.current = new Set(inbox.items.map((item) => item.id))
      actions.updateGitHubInboxItems(inbox.items)
      setGitHubWatchStatus(
        `Connected · last checked ${new Date(inbox.fetchedAt).toLocaleTimeString()} · ${inbox.counts.merged} items`,
      )

      if (newItems.length === 0) return

      const events = newItems.map(mapInboxItemToExternalEvent)

      actions.insertExternalEvents(events)
      actions.addAgentMessages([
        {
          role: 'system',
          content: `GitHub Watch found ${newItems.length} new item${newItems.length > 1 ? 's' : ''}.`,
        },
      ])

      const result = await runAgentPipeline(
        createAgentEvent('EXTERNAL_EVENT_INSERTED', {
          externalEvents: events,
          replaceExternalEvents: true,
          timestamp: inbox.fetchedAt,
        }),
      )

      applyAgentResult(result, { compactChat: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown GitHub watch error'

      setGitHubWatchStatus(`GitHub watch error: ${message}`)
    } finally {
      isGitHubWatchCheckingRef.current = false
    }
  }, [actions, applyAgentResult])

  useEffect(() => {
    if (!isGitHubWatching) {
      setGitHubWatchStatus('GitHub watch off')
      return undefined
    }

    setGitHubWatchStatus('Connecting GitHub watch...')
    void checkGitHubInboxForNewItems(true)

    const intervalId = window.setInterval(() => {
      void checkGitHubInboxForNewItems()
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [checkGitHubInboxForNewItems, isGitHubWatching])

  const handleSendMessage = (message: string) => {
    actions.addAgentMessages([
      {
        role: 'user',
        content: message,
      },
    ])

    void runPipelineAndApply(
      createAgentEvent('USER_COMMAND', {
        command: message,
        timestamp: new Date().toISOString(),
      }),
      { compactChat: true },
    )
  }

  const handleLiquidPointer = useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    target.style.setProperty('--pointer-x', `${x.toFixed(2)}%`)
    target.style.setProperty('--pointer-y', `${y.toFixed(2)}%`)
  }, [])

  const timelineItems: TimelineItem[] = activeSchedulePlan.blocks.map((block) => ({
    time: block.startTime,
    endTime: block.endTime,
    date: block.date ?? activeSchedulePlan.date,
    title: block.title,
    description: block.reason ?? `${block.startTime}-${block.endTime}`,
    mode: block.type,
    priority: block.priority,
  }))

  const firewallItems: FirewallItem[] = activeNotifications.map((notification) => ({
    route: firewallRouteByChannel[notification.channel],
    label: labelByChannel[notification.channel],
    title: notification.title,
    description: notification.reason,
  }))

  const morningSummaryItems: MorningBriefItem[] = activeNotifications
    .filter((notification) => notification.channel === 'digest' || notification.channel === 'silent')
    .map((notification) => ({
      title: notification.title,
      description: notification.reason,
    }))

  return (
    <main className="agent-console" onPointerMove={handleLiquidPointer}>
      <header className="console-header">
        <div>
          <p className="eyebrow">24h Rhythm Agent Console</p>
          <h1>今日节律调度控制台</h1>
        </div>
        <div className="status-strip" aria-label="Console runtime status">
          <span className="system-status">
            <span className="live-dot" aria-hidden="true" />
            {scenarioLabel[state.currentScenario]}
          </span>
          <span>{state.agentMessages.length} 条 Agent 消息</span>
          <span>{activeNotifications.length} 条通知已分流</span>
        </div>
      </header>

      <section className="console-layout" aria-label="Agent console overview">
        <section className="timeline-shell" aria-label="Weekly schedule">
          <Timeline items={timelineItems} />
        </section>

        <section className="chat-shell" aria-label="Agent explanation and chat">
          <AgentPanel
            isSending={isAgentRunning}
            messages={panelMessages}
            onSendMessage={handleSendMessage}
            suggestedActions={state.suggestedActions}
            explanation={
              panelMessages.at(-1)?.text ?? 'Agent 输出会在点击演示按钮后追加到这里。'
            }
            suggestion={
              state.suggestedActions.at(0)?.label ??
              '点击右侧演示按钮，观察排期、通知分流和解释链路。'
            }
          />
          {state.morningBrief && (
            <MorningBrief
              morningBrief={state.morningBrief}
              adjustmentReasons={demoScenario.steps.map((step) => step.expectedAgentMessage)}
              summaryItems={morningSummaryItems}
            />
          )}
        </section>

        <section className="support-grid" aria-label="State and live signals">
          <GitHubInboxPanel
            items={state.githubInboxItems ?? []}
            status={githubWatchStatus}
          />
          <AttentionFirewall items={firewallItems} />
        </section>
      </section>
    </main>
  )
}

export default App
