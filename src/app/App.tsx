import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AgentPanel,
  AttentionFirewall,
  Dashboard,
  DemoControls,
  GitHubInboxPanel,
  MorningBrief,
  Timeline,
} from '../components'
import type {
  AgentMessage as PanelMessage,
  DashboardMetric,
  DemoAction,
  FirewallItem,
  FocusTask,
  MorningBriefItem,
  TimelineItem,
} from '../components'
import {
  demoScenario,
  externalEvents,
  initialNotifications,
  initialSchedulePlan,
  tasks,
  userStates,
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

const scenarioByActionId: Record<
  string,
  'poorSleep' | 'highStress' | 'githubP1' | 'nightMode' | 'morningBrief'
> = {
  poorSleep: 'poorSleep',
  highStress: 'highStress',
  githubP1: 'githubP1',
  nightMode: 'nightMode',
  morningBrief: 'morningBrief',
}

const scenarioLabel = {
  baseline: '基础节律',
  poorSleep: '睡眠差',
  highStress: '压力高',
  githubP1: 'GitHub P1',
  nightMode: '夜间模式',
  morningBrief: '晨报生成',
} satisfies Record<string, string>

const createEventFromAction = (action: DemoAction): AgentRuntimeEvent => {
  const timestamp = new Date().toISOString()

  switch (action.id) {
    case 'poorSleep':
      return createAgentEvent('USER_STATE_CHANGED', {
        userState: userStates.sleepDeprived,
        timestamp,
      })
    case 'highStress':
      return createAgentEvent('USER_STATE_CHANGED', {
        userState: userStates.stressed,
        timestamp,
      })
    case 'githubP1':
      return createAgentEvent('EXTERNAL_EVENT_INSERTED', {
        externalEvent: externalEvents[0],
        timestamp,
      })
    case 'nightMode':
      return createAgentEvent('NIGHT_MODE_STARTED', { timestamp })
    case 'morningBrief':
      return createAgentEvent('MORNING_BRIEF_REQUESTED', { timestamp })
    default:
      return createAgentEvent('INIT', { timestamp })
  }
}

const demoActions: DemoAction[] = [
  { id: 'toggleGithubWatch', label: 'Watch GitHub', description: '每 1 分钟静默检查新通知' },
  { id: 'syncGithubInbox', label: 'Sync GitHub Inbox', description: '拉取账号级 issue / PR / mentions' },
  { id: 'poorSleep', label: '睡眠差', description: '降低上午深度任务密度' },
  { id: 'highStress', label: '压力高', description: '延后强沟通任务' },
  { id: 'githubP1', label: '插入 GitHub P1', description: '触发突发事件解释' },
  { id: 'nightMode', label: '进入夜间模式', description: '普通通知静默归档' },
  { id: 'morningBrief', label: '生成晨报', description: '汇总夜间事件和今日建议' },
  { id: 'reset', label: '重置演示', description: '回到初始状态', variant: 'secondary' },
]

type ApplyAgentResultOptions = {
  compactChat?: boolean
}

function App() {
  const { state, actions } = useAppState()
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [isGitHubWatching, setIsGitHubWatching] = useState(false)
  const [githubWatchStatus, setGitHubWatchStatus] = useState('GitHub watch off')
  const seenGitHubItemIdsRef = useRef<Set<string>>(new Set())
  const isGitHubWatchCheckingRef = useRef(false)
  const activeSchedulePlan = state.schedulePlan ?? initialSchedulePlan
  const activeNotifications =
    state.notifications.length > 0 ? state.notifications : initialNotifications
  const currentUserState = state.userState

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
    const visibleAgentMessages =
      options.compactChat && agentMessages.length > 0
        ? [agentMessages[agentMessages.length - 1]]
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

  const visibleDemoActions = useMemo(
    () =>
      demoActions.map((action) =>
        action.id === 'toggleGithubWatch'
          ? {
              ...action,
              label: isGitHubWatching ? 'Stop GitHub Watch' : 'Watch GitHub',
              description: githubWatchStatus,
              variant: isGitHubWatching ? ('secondary' as const) : action.variant,
            }
          : action,
      ),
    [githubWatchStatus, isGitHubWatching],
  )

  const handleDemoAction = (action: DemoAction) => {
    if (action.id === 'reset') {
      actions.resetDemo()
      return
    }

    if (action.id === 'syncGithubInbox') {
      void handleSyncGitHubInbox()
      return
    }

    if (action.id === 'toggleGithubWatch') {
      setIsGitHubWatching((current) => !current)
      return
    }

    if (action.id === 'poorSleep') {
      actions.setUserState(userStates.sleepDeprived)
    }

    if (action.id === 'highStress') {
      actions.setUserState(userStates.stressed)
    }

    if (action.id === 'githubP1') {
      actions.insertExternalEvent(externalEvents[0])
    }

    const scenario = scenarioByActionId[action.id]
    if (scenario) {
      actions.switchScenario(scenario)
    }

    void runPipelineAndApply(createEventFromAction(action))
  }

  const handleSyncGitHubInbox = async () => {
    setIsAgentRunning(true)

    try {
      const inbox = await fetchGitHubInbox()
      const events = inbox.items.map(mapInboxItemToExternalEvent)

      seenGitHubItemIdsRef.current = new Set(inbox.items.map((item) => item.id))
      actions.updateGitHubInboxItems(inbox.items)
      setGitHubWatchStatus(
        `Last checked ${new Date(inbox.fetchedAt).toLocaleTimeString()} · ${inbox.counts.merged} items`,
      )
      actions.insertExternalEvents(events)
      actions.addAgentMessages([
        {
          role: 'system',
          content: `GitHub Inbox synced: ${inbox.counts.merged} related items (${inbox.counts.notifications} notifications, ${inbox.counts.assigned} assigned, ${inbox.counts.reviewRequested} review requests).`,
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
      const message = error instanceof Error ? error.message : 'Unknown GitHub error'

      actions.addAgentMessages([
        {
          role: 'system',
          content: `GitHub Inbox sync failed: ${message}`,
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

  const timelineItems: TimelineItem[] = activeSchedulePlan.blocks.map((block) => ({
    time: block.startTime,
    title: block.title,
    description: block.reason ?? `${block.startTime}-${block.endTime}`,
    mode: block.type,
  }))

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: 'Sleep',
      value: String(currentUserState.sleepScore),
      note: currentUserState.label ?? '基础状态',
    },
    {
      label: 'Stress',
      value: currentUserState.stressLevel,
      note: currentUserState.adjustmentHint ?? '当前无需额外调整',
    },
    {
      label: 'Focus',
      value: `${currentUserState.focusCapacity}m`,
      note: '当前适合连续专注的分钟数',
    },
    {
      label: 'Plan',
      value: activeSchedulePlan.date,
      note: activeSchedulePlan.summary,
    },
  ]

  const focusTasks: FocusTask[] = tasks.slice(0, 3).map((task) => ({
    title: task.title,
    priority: task.priority,
    window: task.deadline ?? `${task.estimatedMinutes}m`,
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
    <main className="agent-console">
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
        <aside className="layout-left">
          <Timeline items={timelineItems} />
        </aside>

        <section className="layout-center" aria-label="State and agent explanation">
          <Dashboard
            focusTasks={focusTasks}
            metrics={dashboardMetrics}
            recommendation={{
              label: state.currentScenario === 'baseline' ? '当前建议' : 'Agent 已更新',
              title: activeSchedulePlan.summary,
              reason: currentUserState.adjustmentHint ?? '当前按基础排期执行。',
            }}
          />
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

        <aside className="layout-right">
          <GitHubInboxPanel
            items={state.githubInboxItems ?? []}
            status={githubWatchStatus}
          />
          <AttentionFirewall items={firewallItems} />
          <DemoControls
            actions={visibleDemoActions}
            activeActionId={state.currentScenario}
            onAction={handleDemoAction}
          />
        </aside>
      </section>
    </main>
  )
}

export default App
