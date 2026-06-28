import {
  AgentPanel,
  AttentionFirewall,
  Dashboard,
  DemoControls,
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
import { runAgentPipeline } from '../core/runAgentPipeline'
import type { AgentRuntimeEvent } from '../core/agentEvents'
import type { NotificationChannel } from '../types'
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

function App() {
  const { state, actions } = useAppState()
  const activeSchedulePlan = state.schedulePlan ?? initialSchedulePlan
  const activeNotifications =
    state.notifications.length > 0 ? state.notifications : initialNotifications
  const currentUserState = state.userState

  const panelMessages: PanelMessage[] = state.agentMessages.map((message) => ({
    id: message.id,
    role: message.role,
    text: message.content,
  }))

  const handleDemoAction = (action: DemoAction) => {
    if (action.id === 'reset') {
      actions.resetDemo()
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

    const result = runAgentPipeline(createEventFromAction(action))

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

    const messages = [
      ...(result.agentMessages ?? []).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...(result.explanations ?? []).map((explanation) => ({
        role: 'agent' as const,
        content: `解释：${explanation}`,
      })),
    ]

    if (messages.length > 0) {
      actions.addAgentMessages(messages)
    }
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
            messages={panelMessages}
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
          <AttentionFirewall items={firewallItems} />
          <DemoControls activeActionId={state.currentScenario} onAction={handleDemoAction} />
        </aside>
      </section>
    </main>
  )
}

export default App
