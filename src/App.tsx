import {
  CalendarClock,
  Check,
  Command,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Moon,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import './App.css'
import { userStates } from './data/mockData'
import { runAgentOrchestrator } from './core/orchestrator'
import type {
  DemoScenario,
  NotificationBucket,
  NotificationItem,
  ScheduleBlock,
  ScheduleType,
} from './types'

const scenarioLabels: Record<DemoScenario, string> = {
  normal: 'Base Rhythm',
  sleepPoor: 'Low Sleep',
  stressHigh: 'High Pressure',
  githubP1: 'P1 Interrupt',
  nightMode: 'Quiet Night',
  morningBrief: 'Morning Sync',
}

const bucketLabels: Record<NotificationBucket, string> = {
  immediate: 'Now Signal',
  later: 'Soft Landing',
  morning: 'Morning Pool',
  silent: 'Silent Archive',
}

const typeLabels: Record<ScheduleType, string> = {
  fixed: 'Anchor',
  focus: 'Deep Work',
  micro: 'Micro Flow',
  rest: 'Recovery',
  event: 'Interrupt',
}

type WeekEvent = {
  day: number
  endTime: string
  id: string
  span: number
  startTime: string
  title: string
  top: number
  type: ScheduleType
}

let activeScrollFrame = 0
type PageTransitionPhase = 'fade' | 'slide' | null

function App() {
  const [scenario, setScenario] = useState<DemoScenario>('normal')
  const [showAdjuster, setShowAdjuster] = useState(false)
  const [activeNav, setActiveNav] = useState('mission-deck')
  const [secondaryPageVisible, setSecondaryPageVisible] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState<PageTransitionPhase>(null)
  const navLockUntilRef = useRef(0)
  const transitionTimersRef = useRef<number[]>([])
  const pendingTargetRef = useRef('timeline-title')
  const result = useMemo(() => runAgentOrchestrator(scenario), [scenario])
  const state = userStates[scenario]

  useEffect(() => {
    if (!showAdjuster || secondaryPageVisible) return undefined

    const sectionIds = ['mission-deck', 'command-title', 'timeline-title', 'firewall-title', 'agent-title']
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]
        if (performance.now() < navLockUntilRef.current) return
        if (visibleEntry?.target.id) setActiveNav(visibleEntry.target.id)
      },
      {
        rootMargin: '-24% 0px -58% 0px',
        threshold: [0.12, 0.32, 0.56],
      },
    )

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [showAdjuster, secondaryPageVisible])

  useEffect(
    () => () => {
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const openScenarioPage = (nextScenario: DemoScenario, targetId = 'timeline-title') => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    transitionTimersRef.current = []
    pendingTargetRef.current = targetId
    setScenario(nextScenario)
    setActiveNav(targetId)
    setTransitionPhase('fade')
    window.history.replaceState(null, '', `#${targetId}`)

    const revealTimer = window.setTimeout(() => {
      setSecondaryPageVisible(true)
      setTransitionPhase('slide')
      window.scrollTo(0, 0)
    }, 360)

    const settleTimer = window.setTimeout(() => {
      setTransitionPhase(null)
    }, 1180)

    transitionTimersRef.current = [revealTimer, settleTimer]
  }

  const returnHome = () => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    transitionTimersRef.current = []
    setTransitionPhase('fade')
    window.history.replaceState(null, '', '#mission-deck')

    const revealTimer = window.setTimeout(() => {
      setSecondaryPageVisible(false)
      setActiveNav('mission-deck')
      setTransitionPhase('slide')
      window.scrollTo(0, 0)
    }, 320)

    const settleTimer = window.setTimeout(() => {
      setTransitionPhase(null)
    }, 980)

    transitionTimersRef.current = [revealTimer, settleTimer]
  }

  const handleNavJump = (targetId: string) => {
    if (!secondaryPageVisible && targetId !== 'mission-deck' && targetId !== 'command-title') {
      openScenarioPage(scenario, targetId)
      return
    }
    navLockUntilRef.current = performance.now() + 1100
    setActiveNav(targetId)
    scrollToSectionWithBezier(targetId)
  }

  if (!showAdjuster) {
    return (
      <main className="app-shell preview-shell" data-scenario={scenario}>
        <IntroMotion />
        <TodoPreview onAdjust={() => setShowAdjuster(true)} />
      </main>
    )
  }

  return (
    <main
      className="app-shell"
      data-page={secondaryPageVisible ? 'detail' : 'home'}
      data-scenario={scenario}
    >
      {transitionPhase && <div className="page-transition" data-phase={transitionPhase} />}
      {!secondaryPageVisible && (
        <aside className="sidebar" aria-label="主导航">
          <div className="brand-card">
            <div className="system-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>time master</strong>
              <span>life rhythm OS</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <a
              data-active={activeNav === 'mission-deck'}
              href="#mission-deck"
              onClick={(event) => {
                event.preventDefault()
                handleNavJump('mission-deck')
              }}
            >
              <LayoutDashboard aria-hidden="true" />
              <span>Mission Deck</span>
            </a>
            <a
              data-active={activeNav === 'timeline-title'}
              href="#timeline-title"
              onClick={(event) => {
                event.preventDefault()
                handleNavJump('timeline-title')
              }}
            >
              <CalendarClock aria-hidden="true" />
              <span>Rhythm Map</span>
            </a>
            <a
              data-active={activeNav === 'firewall-title'}
              href="#firewall-title"
              onClick={(event) => {
                event.preventDefault()
                handleNavJump('firewall-title')
              }}
            >
              <ShieldCheck aria-hidden="true" />
              <span>Focus Gate</span>
            </a>
            <a
              data-active={activeNav === 'agent-title'}
              href="#agent-title"
              onClick={(event) => {
                event.preventDefault()
                handleNavJump('agent-title')
              }}
            >
              <Sparkles aria-hidden="true" />
              <span>Agent Pulse</span>
            </a>
            <a
              data-active={activeNav === 'command-title'}
              href="#command-title"
              onClick={(event) => {
                event.preventDefault()
                handleNavJump('command-title')
              }}
            >
              <Command aria-hidden="true" />
              <span>Adjust Lab</span>
            </a>
          </nav>

          <div className="sidebar-note">
            <span>Live Context</span>
            <strong>{result.stateLabel}</strong>
          </div>
        </aside>
      )}

      <div className="workspace" data-page={secondaryPageVisible ? 'detail' : 'home'}>
        {!secondaryPageVisible && (
          <>
            <header className="topbar" id="mission-deck">
              <div className="identity-lockup">
                <div>
                  <p className="eyebrow">time master cockpit</p>
                  <h1>个人时间 Agent 调整舱</h1>
                </div>
              </div>
              <div className="status-strip" aria-label="用户状态">
                <Metric label="睡眠" value={state.sleepScore} />
                <Metric label="精力" value={state.energyLevel} />
                <Metric label="压力" value={state.stressLevel} inverse />
              </div>
            </header>

            <section className="command-dock" aria-labelledby="command-title">
              <div className="command-copy">
                <p className="eyebrow">Adjust lab</p>
                <h2 id="command-title">今天怎么调整？</h2>
                <p>把睡眠、任务、突发消息重新折叠成一个可执行的生活节律。</p>
              </div>
              <div className="command-input" aria-label="Agent 指令输入示例">
                <Command aria-hidden="true" />
                <span>
                  {scenario === 'githubP1'
                    ? '插入 GitHub P1，并保护下午主线任务'
                    : scenario === 'sleepPoor'
                      ? '我昨晚没睡好，帮我降强度'
                      : scenario === 'morningBrief'
                        ? '生成晨报，告诉我今天要确认什么'
                        : '生成今天的 Agent 排期建议'}
                </span>
                <kbd>⌘K</kbd>
              </div>
            </section>

            <ScenarioControls scenario={scenario} onScenarioSelect={openScenarioPage} />
          </>
        )}

        {secondaryPageVisible && (
          <section
            className="detail-page"
            data-entering={transitionPhase === 'slide'}
            aria-label={`${scenarioLabels[scenario]} 二级页面`}
          >
            <header className="detail-hero">
              <div>
                <p className="eyebrow">time master second layer</p>
                <h1>{scenarioLabels[scenario]}</h1>
                <span>{result.stateLabel}</span>
              </div>
              <button className="detail-home-button" onClick={returnHome} type="button">
                主页入口
              </button>
            </header>

            <section className="dashboard-grid">
              <Timeline blocks={result.updatedSchedule} />

              <section className="agent-panel" aria-labelledby="agent-title">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Agent Pulse</p>
                    <h2 id="agent-title">{result.stateLabel}</h2>
                  </div>
                  <Sparkles aria-hidden="true" />
                </div>

                <div className="message-stack">
                  {result.agentMessages.map((message) => (
                    <article className="agent-message" key={message.agent}>
                      <span>{message.agent}</span>
                      <p>{message.text}</p>
                    </article>
                  ))}
                </div>

                <AgentTrace scenario={scenario} />

                <div className="explain-list">
                  <h3>Decision Trace</h3>
                  {result.explanations.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>

                <div className="action-list">
                  <h3>Next Moves</h3>
                  {result.suggestedActions.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                {result.morningBrief.length > 0 && (
                  <div className="brief-box">
                    <h3>Morning Signal</h3>
                    {result.morningBrief.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                )}
              </section>

              <Firewall notifications={result.notifications} />
            </section>
          </section>
        )}

      </div>
    </main>
  )
}

function ScenarioControls({
  scenario,
  onScenarioSelect,
}: {
  scenario: DemoScenario
  onScenarioSelect: (scenario: DemoScenario) => void
}) {
  return (
    <section className="command-bar" aria-label="Demo 场景">
      <ScenarioButton
        active={scenario === 'normal'}
        icon={<RotateCcw aria-hidden="true" />}
        label={scenarioLabels.normal}
        onClick={() => onScenarioSelect('normal')}
      />
      <ScenarioButton
        active={scenario === 'sleepPoor'}
        icon={<Zap aria-hidden="true" />}
        label={scenarioLabels.sleepPoor}
        onClick={() => onScenarioSelect('sleepPoor')}
      />
      <ScenarioButton
        active={scenario === 'stressHigh'}
        icon={<ShieldCheck aria-hidden="true" />}
        label={scenarioLabels.stressHigh}
        onClick={() => onScenarioSelect('stressHigh')}
      />
      <ScenarioButton
        active={scenario === 'githubP1'}
        icon={<GitBranch aria-hidden="true" />}
        label={scenarioLabels.githubP1}
        onClick={() => onScenarioSelect('githubP1')}
      />
      <ScenarioButton
        active={scenario === 'nightMode'}
        icon={<Moon aria-hidden="true" />}
        label={scenarioLabels.nightMode}
        onClick={() => onScenarioSelect('nightMode')}
      />
      <ScenarioButton
        active={scenario === 'morningBrief'}
        icon={<Sunrise aria-hidden="true" />}
        label={scenarioLabels.morningBrief}
        onClick={() => onScenarioSelect('morningBrief')}
      />
    </section>
  )
}

function TodoPreview({ onAdjust }: { onAdjust: () => void }) {
  const [todos, setTodos] = useState([
    { id: 'deep-dev', time: '09:00', title: '深度开发 Agent 调度器', tag: 'Deep Work' },
    { id: 'class', time: '10:30', title: '系统设计课', tag: 'Anchor' },
    { id: 'issue', time: '13:45', title: '检查突发 Issue 风险', tag: 'Signal' },
    { id: 'recovery', time: '17:30', title: '拉伸恢复', tag: 'Recovery' },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ time: '', title: '' })

  const startEdit = (todo: (typeof todos)[number]) => {
    setEditingId(todo.id)
    setDraft({ time: todo.time, title: todo.title })
  }

  const saveEdit = () => {
    setTodos((items) =>
      items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              time: draft.time.trim() || item.time,
              title: draft.title.trim() || item.title,
            }
          : item,
      ),
    )
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({ time: '', title: '' })
  }

  return (
    <section className="todo-preview" aria-label="time master todo list">
      <div className="preview-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="eyebrow">time master</p>
      <div className="preview-list">
        {todos.map((todo) => (
          <article className="preview-todo" key={todo.id}>
            {editingId === todo.id ? (
              <>
                <input
                  aria-label="修改时间"
                  className="todo-time-input"
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, time: event.target.value }))
                  }
                  value={draft.time}
                />
                <div className="todo-edit-fields">
                  <input
                    aria-label="修改事项"
                    onChange={(event) =>
                      setDraft((value) => ({ ...value, title: event.target.value }))
                    }
                    value={draft.title}
                  />
                  <span>{todo.tag}</span>
                </div>
                <div className="todo-actions">
                  <button aria-label="保存修改" onClick={saveEdit} type="button">
                    <Check aria-hidden="true" />
                  </button>
                  <button aria-label="取消修改" onClick={cancelEdit} type="button">
                    <X aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <time>{todo.time}</time>
                <div>
                  <h2>{todo.title}</h2>
                  <span>{todo.tag}</span>
                </div>
                <div className="todo-actions">
                  <button aria-label={`修改 ${todo.title}`} onClick={() => startEdit(todo)} type="button">
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    aria-label={`删除 ${todo.title}`}
                    onClick={() =>
                      setTodos((items) => items.filter((item) => item.id !== todo.id))
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
        {todos.length === 0 && (
          <div className="preview-empty">
            <h2>今日待办已清空</h2>
            <span>可以直接进入调整舱重新生成安排。</span>
          </div>
        )}
      </div>
      <button className="adjust-button" onClick={onAdjust} type="button">
        我要更改安排
      </button>
    </section>
  )
}

function IntroMotion() {
  return (
    <div className="intro-motion" aria-hidden="true">
      <div className="intro-logo">
        <span>Sleep</span>
        <span>Focus</span>
        <span>Issue</span>
        <span>Brief</span>
      </div>
      <p>time master</p>
    </div>
  )
}

function scrollToSectionWithBezier(targetId: string) {
  const target = document.getElementById(targetId)
  if (!target) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = window.scrollY
  const targetY = target.getBoundingClientRect().top + window.scrollY - 24
  const distance = targetY - start

  window.history.replaceState(null, '', `#${targetId}`)

  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo(0, targetY)
    return
  }

  const duration = Math.min(980, Math.max(520, Math.abs(distance) * 0.62))
  const ease = createCubicBezier(0.22, 1, 0.36, 1)
  const startTime = performance.now()

  if (activeScrollFrame) cancelAnimationFrame(activeScrollFrame)

  const animate = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    window.scrollTo(0, start + distance * ease(progress))
    if (progress < 1) {
      activeScrollFrame = requestAnimationFrame(animate)
    } else {
      activeScrollFrame = 0
    }
  }

  activeScrollFrame = requestAnimationFrame(animate)
}

function createCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sampleCurveX = (time: number) =>
    ((1 - 3 * x2 + 3 * x1) * time + (3 * x2 - 6 * x1)) * time * time + 3 * x1 * time
  const sampleCurveY = (time: number) =>
    ((1 - 3 * y2 + 3 * y1) * time + (3 * y2 - 6 * y1)) * time * time + 3 * y1 * time
  const sampleCurveDerivativeX = (time: number) =>
    (3 * (1 - 3 * x2 + 3 * x1) * time + 2 * (3 * x2 - 6 * x1)) * time + 3 * x1

  return (progress: number) => {
    let time = progress
    for (let index = 0; index < 5; index += 1) {
      const slope = sampleCurveDerivativeX(time)
      if (Math.abs(slope) < 0.001) break
      time -= (sampleCurveX(time) - progress) / slope
    }
    return sampleCurveY(Math.min(1, Math.max(0, time)))
  }
}

function AgentTrace({ scenario }: { scenario: DemoScenario }) {
  const agents = [
    { id: 'priority', label: 'Priority', active: true },
    {
      id: 'state',
      label: 'State',
      active: scenario === 'sleepPoor' || scenario === 'stressHigh',
    },
    { id: 'event', label: 'Event', active: scenario === 'githubP1' },
    { id: 'schedule', label: 'Schedule', active: true },
    {
      id: 'firewall',
      label: 'Firewall',
      active:
        scenario === 'githubP1' ||
        scenario === 'nightMode' ||
        scenario === 'morningBrief',
    },
    { id: 'explain', label: 'Explain', active: true },
  ]

  return (
    <div className="agent-trace" aria-label="Agent 调度链路">
      {agents.map((agent) => (
        <span data-active={agent.active} key={agent.id}>
          {agent.label}
        </span>
      ))}
    </div>
  )
}

function Metric({
  label,
  value,
  inverse,
}: {
  label: string
  value: number
  inverse?: boolean
}) {
  const score = inverse ? 100 - value : value
  const tone = score > 70 ? 'good' : score > 45 ? 'warn' : 'risk'

  return (
    <div className="metric" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Timeline({ blocks }: { blocks: ScheduleBlock[] }) {
  const weekDays = [
    { week: '周日', date: '5月31日' },
    { week: '周一', date: '6月1日' },
    { week: '周二', date: '2' },
    { week: '周三', date: '3' },
    { week: '周四', date: '4' },
    { week: '周五', date: '5' },
    { week: '周六', date: '6' },
  ]
  const hours = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
  const blocksKey = blocks.map((block) => `${block.id}:${block.startTime}-${block.endTime}`).join('|')
  const [eventBlocks, setEventBlocks] = useState<WeekEvent[]>(() => buildWeekEvents(blocks))
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventDraft, setEventDraft] = useState({
    day: 0,
    endTime: '15:00',
    startTime: '14:00',
    title: '',
  })
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)
  const [dropPreview, setDropPreview] = useState<{ day: number; top: number } | null>(null)
  const dayGridRef = useRef<HTMLDivElement | null>(null)
  const dragCandidateRef = useRef<{ id: string; startX: number; startY: number } | null>(null)
  const dragMovedRef = useRef(false)
  const cleanupDragRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setEventBlocks(buildWeekEvents(blocks))
    setEditingEventId(null)
  }, [blocks, blocksKey])

  const editingEvent = eventBlocks.find((event) => event.id === editingEventId)

  const startEventEdit = (event: WeekEvent) => {
    setEditingEventId(event.id)
    setEventDraft({
      day: event.day,
      endTime: event.endTime,
      startTime: event.startTime,
      title: event.title,
    })
  }

  const saveEventEdit = () => {
    const startTime = normalizeTimeInput(eventDraft.startTime, editingEvent?.startTime ?? '14:00')
    const endTime = normalizeTimeInput(eventDraft.endTime, editingEvent?.endTime ?? '15:00')
    setEventBlocks((events) =>
      events.map((event) => {
        if (event.id !== editingEventId) return event
        return normalizeWeekEvent({
          ...event,
          day: eventDraft.day,
          endTime,
          startTime,
          title: eventDraft.title.trim() || event.title,
        })
      }),
    )
    setEditingEventId(null)
  }

  const deleteEvent = () => {
    setEventBlocks((events) => events.filter((event) => event.id !== editingEventId))
    setEditingEventId(null)
  }

  const getDropPosition = (event: { clientX: number; clientY: number }) => {
    const grid = dayGridRef.current
    if (!grid) return null

    const rect = grid.getBoundingClientRect()
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width - 1)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height - 1)
    const day = Math.min(6, Math.max(0, Math.floor((x / rect.width) * 7)))
    const top = Math.min(20, Math.max(1, Math.floor((y / rect.height) * 20) + 1))

    return { day, top }
  }

  const moveEventToPosition = (eventId: string, position: { day: number; top: number }) => {
    setEventBlocks((events) =>
      events.map((item) => {
        if (item.id !== eventId) return item
        const startMinutes = topToMinutes(position.top)
        const duration = timeToMinutes(item.endTime) - timeToMinutes(item.startTime)
        const safeDuration = Math.max(30, duration)
        const endMinutes = Math.min(24 * 60, startMinutes + safeDuration)

        return normalizeWeekEvent({
          ...item,
          day: position.day,
          endTime: minutesToTime(endMinutes),
          startTime: minutesToTime(startMinutes),
        })
      }),
    )
    setEditingEventId(null)
  }

  const startMouseDrag = (event: ReactMouseEvent<HTMLButtonElement>, eventId: string) => {
    if (cleanupDragRef.current) cleanupDragRef.current()

    dragCandidateRef.current = { id: eventId, startX: event.clientX, startY: event.clientY }
    dragMovedRef.current = false

    const updateDrag = (moveEvent: MouseEvent) => {
      const candidate = dragCandidateRef.current
      if (!candidate) return

      const distance = Math.hypot(
        moveEvent.clientX - candidate.startX,
        moveEvent.clientY - candidate.startY,
      )
      if (distance < 6 && !dragMovedRef.current) return

      dragMovedRef.current = true
      setDraggingEventId(candidate.id)
      const position = getDropPosition(moveEvent)
      if (position) setDropPreview(position)
    }

    const finishDrag = (upEvent: MouseEvent) => {
      const candidate = dragCandidateRef.current
      const position = getDropPosition(upEvent)

      if (candidate && dragMovedRef.current && position) {
        moveEventToPosition(candidate.id, position)
        upEvent.preventDefault()
      }

      cleanupDragRef.current?.()
    }

    cleanupDragRef.current = () => {
      window.removeEventListener('mousemove', updateDrag)
      window.removeEventListener('mouseup', finishDrag)
      dragCandidateRef.current = null
      setDraggingEventId(null)
      setDropPreview(null)
    }

    window.addEventListener('mousemove', updateDrag)
    window.addEventListener('mouseup', finishDrag, { once: true })
  }

  useEffect(() => () => cleanupDragRef.current?.(), [])

  return (
    <section className="timeline-panel" aria-labelledby="timeline-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Rhythm Map</p>
          <h2 id="timeline-title">Today Stack</h2>
        </div>
        <CalendarClock aria-hidden="true" />
      </div>

      <div className="week-toolbar">
        <button type="button">今天</button>
        <span>‹</span>
        <span>›</span>
        <strong>2026年6月28日 - 7月4日</strong>
        <div aria-label="视图模式">
          <button type="button">日</button>
          <button data-active="true" type="button">周</button>
          <button type="button">月</button>
        </div>
      </div>

      <div className="week-calendar">
        <div className="week-corner">GMT+8</div>
        {weekDays.map((day) => (
          <div className="week-day" key={day.week}>
            <span>{day.week}</span>
            <strong>{day.date}</strong>
          </div>
        ))}
        <div className="week-grid">
          <div className="time-column">
            {hours.map((hour) => (
              <span key={hour}>{hour}</span>
            ))}
          </div>
          <div
            className="day-grid"
            data-dragging={draggingEventId ? 'true' : undefined}
            ref={dayGridRef}
          >
            {weekDays.map((day) => (
              <div className="day-column" key={day.week}>
                {hours.map((hour) => (
                  <span className="hour-line" key={hour} />
                ))}
              </div>
            ))}
            {dropPreview && draggingEventId && (
              <div
                aria-hidden="true"
                className="drop-preview"
                style={{
                  gridColumn: dropPreview.day + 1,
                  gridRow: `${dropPreview.top} / span ${
                    eventBlocks.find((event) => event.id === draggingEventId)?.span ?? 1
                  }`,
                }}
              />
            )}
            {eventBlocks.map((event) => (
              <button
                aria-label={`编辑 ${event.title}`}
                className="week-event"
                data-dragging={event.id === draggingEventId}
                data-type={event.type}
                key={event.id}
                onClick={(clickEvent) => {
                  if (dragMovedRef.current) {
                    clickEvent.preventDefault()
                    dragMovedRef.current = false
                    return
                  }
                  startEventEdit(event)
                }}
                onMouseDown={(mouseEvent) => startMouseDrag(mouseEvent, event.id)}
                style={{
                  gridColumn: event.day + 1,
                  gridRow: `${event.top} / span ${event.span}`,
                }}
                type="button"
              >
                <span>{event.title}</span>
                <small>{event.startTime} - {event.endTime}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {editingEvent && (
        <div className="event-editor" role="dialog" aria-label="编辑日程">
          <div className="event-editor-heading">
            <div>
              <p className="eyebrow">Edit Stack</p>
              <h3>{editingEvent.title}</h3>
            </div>
            <button aria-label="关闭编辑" onClick={() => setEditingEventId(null)} type="button">
              <X aria-hidden="true" />
            </button>
          </div>
          <label>
            标题
            <input
              aria-label="编辑日程标题"
              value={eventDraft.title}
              onChange={(event) =>
                setEventDraft((value) => ({ ...value, title: event.target.value }))
              }
            />
          </label>
          <label>
            日期
            <select
              value={eventDraft.day}
              onChange={(event) =>
                setEventDraft((value) => ({ ...value, day: Number(event.target.value) }))
              }
            >
              {weekDays.map((day, index) => (
                <option key={day.week} value={index}>
                  {day.week} {day.date}
                </option>
              ))}
            </select>
          </label>
          <div className="event-time-grid">
            <label>
              开始
              <input
                aria-label="编辑开始时间"
                inputMode="numeric"
                placeholder="14:00"
                value={eventDraft.startTime}
                onChange={(event) =>
                  setEventDraft((value) => ({ ...value, startTime: event.target.value }))
                }
              />
            </label>
            <label>
              结束
              <input
                aria-label="编辑结束时间"
                inputMode="numeric"
                placeholder="15:00"
                value={eventDraft.endTime}
                onChange={(event) =>
                  setEventDraft((value) => ({ ...value, endTime: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="event-editor-actions">
            <button onClick={saveEventEdit} type="button">
              保存修改
            </button>
            <button onClick={deleteEvent} type="button">
              删除日程
            </button>
          </div>
        </div>
      )}

      <div className="timeline-list compact-stack">
        {blocks.slice(0, 5).map((block) => (
          <article className="timeline-item" data-type={block.type} key={block.id}>
            <time>
              {block.startTime}
              <span>{block.endTime}</span>
            </time>
            <div className="timeline-body">
              <div className="item-title-row">
                <h3>{block.title}</h3>
                {block.priority && <span className="priority">{block.priority}</span>}
              </div>
              <p>{block.reason}</p>
              <span className="type-chip">{typeLabels[block.type]}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function buildWeekEvents(blocks: ScheduleBlock[]): WeekEvent[] {
  const mapped = blocks
    .filter((block) => Number.parseInt(block.startTime.slice(0, 2), 10) >= 14)
    .slice(0, 8)
    .map((block, index) => {
      const hour = Number.parseInt(block.startTime.slice(0, 2), 10)
      const minute = Number.parseInt(block.startTime.slice(3, 5), 10)
      return {
        day: index < 5 ? index : 6,
        endTime: block.endTime,
        id: block.id,
        span: getEventSpan(block.startTime, block.endTime),
        startTime: block.startTime,
        title: block.title,
        top: Math.max(1, (hour - 14) * 2 + (minute >= 30 ? 2 : 1)),
        type: block.type,
      }
    })

  return [
    ...mapped,
    normalizeWeekEvent({
      day: 4,
      endTime: '22:30',
      id: 'weekly-reminder',
      span: 1,
      startTime: '22:00',
      title: '提醒给每个机制',
      top: 17,
      type: 'micro' as ScheduleType,
    }),
    normalizeWeekEvent({
      day: 6,
      endTime: '17:00',
      id: 'basketball',
      span: 4,
      startTime: '14:00',
      title: '打球（休息时单词）',
      top: 1,
      type: 'rest' as ScheduleType,
    }),
  ]
}

function normalizeWeekEvent(event: WeekEvent): WeekEvent {
  return {
    ...event,
    span: getEventSpan(event.startTime, event.endTime),
    top: getEventTop(event.startTime),
  }
}

function getEventTop(time: string) {
  return Math.min(20, Math.max(1, Math.floor((timeToMinutes(time) - 14 * 60) / 30) + 1))
}

function getEventSpan(startTime: string, endTime: string) {
  const startHour = Number.parseInt(startTime.slice(0, 2), 10)
  const startMinute = Number.parseInt(startTime.slice(3, 5), 10)
  const endHour = Number.parseInt(endTime.slice(0, 2), 10)
  const endMinute = Number.parseInt(endTime.slice(3, 5), 10)
  const minutes = Math.max(30, endHour * 60 + endMinute - (startHour * 60 + startMinute))
  return Math.min(20, Math.max(1, Math.ceil(minutes / 30)))
}

function normalizeTimeInput(value: string, fallback: string) {
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}$/.test(trimmed)) return `${trimmed.slice(0, 2)}:${trimmed.slice(2)}`
  return fallback
}

function timeToMinutes(time: string) {
  const hour = Number.parseInt(time.slice(0, 2), 10)
  const minute = Number.parseInt(time.slice(3, 5), 10)
  return hour * 60 + minute
}

function topToMinutes(top: number) {
  return 14 * 60 + (top - 1) * 30
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function Firewall({ notifications }: { notifications: NotificationItem[] }) {
  const grouped = notifications.reduce<Record<NotificationBucket, NotificationItem[]>>(
    (acc, item) => {
      acc[item.bucket].push(item)
      return acc
    },
    {
      immediate: [],
      later: [],
      morning: [],
      silent: [],
    },
  )

  return (
    <section className="firewall-panel" aria-labelledby="firewall-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Focus Gate</p>
          <h2 id="firewall-title">Signal Routing</h2>
        </div>
        <Inbox aria-hidden="true" />
      </div>

      <div className="bucket-grid">
        {(Object.keys(grouped) as NotificationBucket[]).map((bucket) => (
          <div className="bucket" data-bucket={bucket} key={bucket}>
            <div className="bucket-title">
              <span>{bucketLabels[bucket]}</span>
              <strong>{grouped[bucket].length}</strong>
            </div>
            {grouped[bucket].length === 0 ? (
              <p className="empty">无</p>
            ) : (
              grouped[bucket].map((item) => (
                <article className="notification" key={item.id}>
                  <div>
                    <h3>{item.title}</h3>
                    <span>
                      {item.source} · {item.priority}
                    </span>
                  </div>
                  <p>{item.reason}</p>
                </article>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function ScenarioButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button className="scenario-button" data-active={active} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default App
